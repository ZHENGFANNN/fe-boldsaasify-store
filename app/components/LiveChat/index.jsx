"use client";

import React from "react";
import Cookies from "js-cookie";
import styles from "./index.module.scss";
import {
  createChatSession,
  getChatConfig,
  getChatMessages,
  refreshWsToken,
  sendChatMessage,
  sendOfflineMessage,
} from "./api";
import openLiveChat, { registerLiveChatOpen } from "./openLiveChat";

const VISITOR_KEY = "boldradiant_chat_visitor_key";
const CHAT_END_BODY = "__CHAT_END__";

function getVisitorKey() {
  if (typeof window === "undefined") return "";
  let key = localStorage.getItem(VISITOR_KEY);
  if (!key) {
    key =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `v_${Date.now()}_${Math.random().toString(16).slice(2)}`;
    localStorage.setItem(VISITOR_KEY, key);
  }
  return key;
}

function getWsBaseUrl() {
  const envUrl = process.env.NEXT_PUBLIC_CHAT_WS_URL;
  if (envUrl) return envUrl.replace(/\/$/, "");
  const apiHost = process.env.NEXT_PUBLIC_HOST;
  if (apiHost) {
    return apiHost.replace(/^http:\/\//i, "ws://").replace(/^https:\/\//i, "wss://").replace(/\/$/, "");
  }
  if (typeof window !== "undefined") {
    const { protocol, hostname } = window.location;
    const wsProtocol = protocol === "https:" ? "wss:" : "ws:";
    return `${wsProtocol}//${hostname}:10000`;
  }
  return "ws://127.0.0.1:10000";
}

function uuid() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `m_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function upsertMessage(list, msg) {
  if (!msg?.id) return list;
  const idx = list.findIndex(
    (item) =>
      String(item.id) === String(msg.id) ||
      (msg.client_msg_id && item.client_msg_id === msg.client_msg_id)
  );
  if (idx >= 0) {
    const next = [...list];
    next[idx] = { ...next[idx], ...msg };
    return next;
  }
  return [...list, msg];
}

export default function LiveChat({ locale, area }) {
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [config, setConfig] = React.useState(null);
  const [session, setSession] = React.useState(null);
  const [messages, setMessages] = React.useState([]);
  const [input, setInput] = React.useState("");
  const [offline, setOffline] = React.useState({
    email: "",
    phone: "",
    content: "",
  });
  const [offlineSent, setOfflineSent] = React.useState(false);
  const wsRef = React.useRef(null);
  const lastIdRef = React.useRef(0);
  const visitorKeyRef = React.useRef("");

  const isWorkTime = config?.is_work_time !== false;
  const welcomeText = session?.welcome_text || config?.welcome_text || "";
  const closed = session?.status === "closed";

  const connectWs = React.useCallback(async (sess) => {
    if (!sess?.ws_token || !sess?.conversation_id) return;
    wsRef.current?.close?.();
    const url = `${getWsBaseUrl()}/ws/visitor?token=${encodeURIComponent(sess.ws_token)}`;
    const ws = new WebSocket(url);
    wsRef.current = ws;
    ws.onmessage = (evt) => {
      try {
        const frame = JSON.parse(evt.data);
        if (frame.type === "message" && frame.data) {
          setMessages((prev) => upsertMessage(prev, frame.data));
          if (frame.data.id) {
            lastIdRef.current = Math.max(lastIdRef.current, Number(frame.data.id));
          }
        }
        if (frame.type === "conversation.updated" && frame.data?.status) {
          setSession((prev) => (prev ? { ...prev, status: frame.data.status } : prev));
        }
      } catch (err) {
        console.warn("[LiveChat] ws parse failed", err);
      }
    };
    ws.onclose = async () => {
      if (!visitorKeyRef.current || !sess?.conversation_id) return;
      try {
        const res = await refreshWsToken({
          conversation_id: sess.conversation_id,
          visitor_key: visitorKeyRef.current,
        });
        if (res?.code === 0 && res.data?.ws_token) {
          connectWs({ ...sess, ws_token: res.data.ws_token });
        }
      } catch (err) {
        console.warn("[LiveChat] ws reconnect failed", err);
      }
    };
  }, []);

  const bootstrap = React.useCallback(async () => {
    setLoading(true);
    try {
      const cfgRes = await getChatConfig();
      if (cfgRes?.code !== 0) return;
      setConfig(cfgRes.data);
      if (!cfgRes.data?.enabled) return;

      if (!cfgRes.data?.is_work_time) return;

      const visitorKey = getVisitorKey();
      visitorKeyRef.current = visitorKey;
      const areaCode = area || Cookies.get("area") || "us";
      const sessRes = await createChatSession({
        visitor_key: visitorKey,
        locale: locale || "en",
        area: areaCode,
        page_url: typeof window !== "undefined" ? window.location.href : "",
      });
      if (sessRes?.code !== 0) return;
      const sess = sessRes.data;
      setSession(sess);
      setMessages(Array.isArray(sess.messages) ? sess.messages : []);
      if (sess.messages?.length) {
        lastIdRef.current = Math.max(
          ...sess.messages.map((m) => Number(m.id) || 0),
          0
        );
      }
      await connectWs(sess);
    } catch (err) {
      console.warn("[LiveChat] bootstrap failed", err);
    } finally {
      setLoading(false);
    }
  }, [area, connectWs, locale]);

  React.useEffect(() => {
    registerLiveChatOpen((forceOpen) => {
      setOpen(true);
      if (forceOpen) bootstrap();
    });
    bootstrap();
    return () => {
      registerLiveChatOpen(null);
      wsRef.current?.close?.();
    };
  }, [bootstrap]);

  React.useEffect(() => {
    if (!open || !session?.conversation_id || !visitorKeyRef.current) return;
    const timer = setInterval(async () => {
      try {
        const res = await getChatMessages({
          conversation_id: session.conversation_id,
          visitor_key: visitorKeyRef.current,
          after_id: lastIdRef.current,
        });
        if (res?.code === 0 && Array.isArray(res.data)) {
          setMessages((prev) => {
            let next = prev;
            res.data.forEach((msg) => {
              next = upsertMessage(next, msg);
              lastIdRef.current = Math.max(lastIdRef.current, Number(msg.id) || 0);
            });
            return next;
          });
        }
      } catch (err) {
        // ignore polling errors
      }
    }, 30000);
    return () => clearInterval(timer);
  }, [open, session?.conversation_id]);

  const handleSend = async () => {
    const body = input.trim();
    if (!body || !session?.conversation_id || closed) return;
    const clientMsgId = uuid();
    setInput("");
    try {
      const res = await sendChatMessage({
        conversation_id: session.conversation_id,
        visitor_key: visitorKeyRef.current,
        body,
        client_msg_id: clientMsgId,
      });
      if (res?.code === 0) {
        setMessages((prev) => upsertMessage(prev, res.data));
        if (res.data?.id) {
          lastIdRef.current = Math.max(lastIdRef.current, Number(res.data.id));
        }
      }
    } catch (err) {
      console.warn("[LiveChat] send failed", err);
    }
  };

  const handleOfflineSubmit = async () => {
    const email = offline.email.trim();
    const content = offline.content.trim();
    if (!email || !content) return;
    try {
      const res = await sendOfflineMessage({
        email,
        phone: offline.phone.trim(),
        content,
        locale: locale || "en",
        area: area || Cookies.get("area") || "us",
        page_url: typeof window !== "undefined" ? window.location.href : "",
      });
      if (res?.code === 0) {
        setOfflineSent(true);
      }
    } catch (err) {
      console.warn("[LiveChat] offline submit failed", err);
    }
  };

  if (config && config.enabled === false) return null;

  return (
    <div className={styles.wrapper}>
      {open && (
        <div className={styles.panel}>
          <div className={styles.header}>Live Chat</div>
          {!isWorkTime ? (
            <div className={styles.hint}>
              {offlineSent ? (
                <p>留言已提交，我们会尽快回复您。</p>
              ) : (
                <>
                  <p>当前非在线客服时间，请留下联系方式。</p>
                  <div className={styles.offlineForm}>
                    <input
                      placeholder="Email"
                      value={offline.email}
                      onChange={(e) =>
                        setOffline((s) => ({ ...s, email: e.target.value }))
                      }
                    />
                    <input
                      placeholder="Phone (optional)"
                      value={offline.phone}
                      onChange={(e) =>
                        setOffline((s) => ({ ...s, phone: e.target.value }))
                      }
                    />
                    <textarea
                      rows={4}
                      placeholder="Message"
                      value={offline.content}
                      onChange={(e) =>
                        setOffline((s) => ({ ...s, content: e.target.value }))
                      }
                    />
                    <button
                      type="button"
                      className={styles.sendBtn}
                      onClick={handleOfflineSubmit}
                    >
                      Submit
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <>
              <div className={styles.messages}>
                {welcomeText ? (
                  <div className={styles.welcome}>{welcomeText}</div>
                ) : null}
                {messages.map((msg) => {
                  const isVisitor = msg.sender_type === "visitor";
                  const isSystem = msg.msg_type === "system" || msg.body === CHAT_END_BODY;
                  return (
                    <div
                      key={msg.id || msg.client_msg_id}
                      className={`${styles.msgRow} ${
                        isVisitor ? styles.msgRowVisitor : styles.msgRowAgent
                      }`}
                    >
                      <div
                        className={`${styles.bubble} ${
                          isVisitor ? styles.bubbleVisitor : styles.bubbleAgent
                        }`}
                      >
                        {isSystem ? "Chat ended" : msg.body}
                        {msg.created_time ? (
                          <div className={styles.time}>{msg.created_time}</div>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
                {loading ? <div className={styles.hint}>Loading...</div> : null}
              </div>
              <div className={styles.footer}>
                {closed ? (
                  <div className={styles.hint}>会话已结束</div>
                ) : (
                  <div className={styles.inputRow}>
                    <input
                      className={styles.input}
                      value={input}
                      placeholder="Type a message..."
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSend();
                        }
                      }}
                    />
                    <button
                      type="button"
                      className={styles.sendBtn}
                      onClick={handleSend}
                    >
                      Send
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}
      <button
        type="button"
        className={styles.toggle}
        aria-label="Open live chat"
        onClick={() => {
          setOpen((v) => !v);
          if (!open) bootstrap();
        }}
      >
        Chat
      </button>
    </div>
  );
}

export { openLiveChat };
