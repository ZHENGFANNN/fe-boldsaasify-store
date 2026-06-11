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
const BRAND_NAME = "BoldRadiant";

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

function formatMsgTime(value) {
  if (!value) return "";
  const normalized = String(value).replace(" ", "T");
  const d = new Date(normalized);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function ChatBubbleIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v7A2.5 2.5 0 0 1 17.5 15H9l-4.2 3.15A1 1 0 0 1 3.5 17.3V5.5Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 12.5 19 4l-2.5 8.5L11 14l-7 2.5Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M11 14 19 4" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M7 7l10 10M17 7 7 17" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M6 12.5 10 16.5 18 7.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
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
  const messagesEndRef = React.useRef(null);

  const isWorkTime = config?.is_work_time !== false;
  const welcomeText = session?.welcome_text || config?.welcome_text || "";
  const closed = session?.status === "closed";

  const scrollToBottom = React.useCallback(() => {
    messagesEndRef.current?.scrollIntoView?.({ behavior: "smooth" });
  }, []);

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

  React.useEffect(() => {
    if (open && isWorkTime) {
      scrollToBottom();
    }
  }, [open, isWorkTime, messages, scrollToBottom]);

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

  const closePanel = () => setOpen(false);

  const renderHeader = (title, statusText, online = true) => (
    <div className={styles.header}>
      <div className={styles.headerInner}>
        <div className={styles.headerAvatar} aria-hidden="true">
          BR
        </div>
        <div className={styles.headerText}>
          <div className={styles.headerTitle}>{title}</div>
          <div className={styles.headerStatus}>
            <span
              className={`${styles.statusDot} ${online ? "" : styles.statusDotOffline}`}
            />
            {statusText}
          </div>
        </div>
        <button
          type="button"
          className={styles.headerClose}
          aria-label="Close chat"
          onClick={closePanel}
        >
          <CloseIcon />
        </button>
      </div>
      <div className={styles.headerWave} aria-hidden="true" />
    </div>
  );

  if (config && config.enabled === false) return null;

  return (
    <div className={styles.wrapper}>
      {open && (
        <div className={styles.panel} role="dialog" aria-label="Live chat">
          {!isWorkTime ? (
            <>
              {renderHeader(
                "Leave a Message",
                offlineSent ? "Submitted" : "We will reply soon",
                false
              )}
              <div className={styles.body}>
                {offlineSent ? (
                  <div className={styles.successCard}>
                    <div className={styles.successIcon}>
                      <CheckIcon />
                    </div>
                    <div className={styles.successTitle}>Message received</div>
                    <div className={styles.successText}>
                      Thank you. Our team will get back to you as soon as possible.
                    </div>
                  </div>
                ) : (
                  <>
                    <div className={styles.offlineScroll}>
                      <p className={styles.offlineIntro}>
                        We are currently offline. Leave your contact details and we will follow up shortly.
                      </p>
                      <div className={styles.offlineForm}>
                        <div className={styles.formField}>
                          <label className={styles.formLabel} htmlFor="chat-offline-email">
                            Email
                          </label>
                          <input
                            id="chat-offline-email"
                            className={styles.formInput}
                            placeholder="you@example.com"
                            value={offline.email}
                            onChange={(e) =>
                              setOffline((s) => ({ ...s, email: e.target.value }))
                            }
                          />
                        </div>
                        <div className={styles.formField}>
                          <label className={styles.formLabel} htmlFor="chat-offline-phone">
                            Phone (optional)
                          </label>
                          <input
                            id="chat-offline-phone"
                            className={styles.formInput}
                            placeholder="+1 000 000 0000"
                            value={offline.phone}
                            onChange={(e) =>
                              setOffline((s) => ({ ...s, phone: e.target.value }))
                            }
                          />
                        </div>
                        <div className={styles.formField}>
                          <label className={styles.formLabel} htmlFor="chat-offline-content">
                            Message
                          </label>
                          <textarea
                            id="chat-offline-content"
                            className={styles.formTextarea}
                            rows={4}
                            placeholder="How can we help you?"
                            value={offline.content}
                            onChange={(e) =>
                              setOffline((s) => ({ ...s, content: e.target.value }))
                            }
                          />
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      className={styles.submitBtn}
                      onClick={handleOfflineSubmit}
                    >
                      Submit
                    </button>
                  </>
                )}
              </div>
            </>
          ) : (
            <>
              {renderHeader(
                BRAND_NAME,
                closed ? "Chat ended" : "Online support",
                !closed
              )}
              <div className={styles.body}>
                <div className={styles.messages}>
                  {welcomeText ? (
                    <div className={styles.welcome}>{welcomeText}</div>
                  ) : null}
                  {messages.map((msg) => {
                    const isVisitor = msg.sender_type === "visitor";
                    const isSystem =
                      msg.msg_type === "system" || msg.body === CHAT_END_BODY;
                    if (isSystem) {
                      return (
                        <div
                          key={msg.id || msg.client_msg_id}
                          className={`${styles.msgRow} ${styles.msgRowAgent}`}
                        >
                          <div className={`${styles.bubble} ${styles.bubbleSystem}`}>
                            <div className={styles.systemLine}>
                              {msg.body === CHAT_END_BODY ? "Chat ended" : msg.body}
                            </div>
                          </div>
                        </div>
                      );
                    }
                    return (
                      <div
                        key={msg.id || msg.client_msg_id}
                        className={`${styles.msgRow} ${
                          isVisitor ? styles.msgRowVisitor : styles.msgRowAgent
                        }`}
                      >
                        {!isVisitor ? (
                          <div className={styles.agentAvatar} aria-hidden="true">
                            BR
                          </div>
                        ) : null}
                        <div
                          className={`${styles.bubble} ${
                            isVisitor ? styles.bubbleVisitor : styles.bubbleAgent
                          }`}
                        >
                          {msg.body}
                          {msg.created_time ? (
                            <div className={styles.time}>
                              {formatMsgTime(msg.created_time)}
                            </div>
                          ) : null}
                        </div>
                      </div>
                    );
                  })}
                  {loading ? (
                    <div className={styles.hint}>
                      <span className={styles.loadingDots} aria-label="Loading">
                        <span />
                        <span />
                        <span />
                      </span>
                    </div>
                  ) : null}
                  <div ref={messagesEndRef} />
                </div>
                <div className={styles.footer}>
                  {closed ? (
                    <div className={styles.hint}>This conversation has ended.</div>
                  ) : (
                    <div className={styles.inputWrap}>
                      <div className={styles.inputBox}>
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
                      </div>
                      <button
                        type="button"
                        className={styles.sendBtnRound}
                        aria-label="Send message"
                        disabled={!input.trim()}
                        onClick={handleSend}
                      >
                        <SendIcon />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      )}
      <button
        type="button"
        className={`${styles.toggle} ${open ? styles.toggleOpen : ""}`}
        aria-label={open ? "Close live chat" : "Open live chat"}
        aria-expanded={open}
        onClick={() => {
          if (open) {
            closePanel();
            return;
          }
          setOpen(true);
          bootstrap();
        }}
      >
        <ChatBubbleIcon />
      </button>
    </div>
  );
}

export { openLiveChat };
