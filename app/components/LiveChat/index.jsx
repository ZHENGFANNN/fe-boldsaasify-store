"use client";

import React from "react";
import Cookies from "js-cookie";
import styles from "./index.module.scss";
import {
  createChatSession,
  createOfflineSession,
  getChatConfig,
  getChatMessages,
  getOfflineThread,
  refreshWsToken,
  sendChatMessage,
  sendOfflineMessage,
} from "./api";
import { getFaqCopy, getFaqItems } from "./faq";
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
    return apiHost
      .replace(/^http:\/\//i, "ws://")
      .replace(/^https:\/\//i, "wss://")
      .replace(/\/$/, "");
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
  if (!msg) return list;
  const idx = list.findIndex(
    (item) =>
      (msg.id && String(item.id) === String(msg.id)) ||
      (msg.client_msg_id && item.client_msg_id === msg.client_msg_id)
  );
  if (idx >= 0) {
    const next = [...list];
    next[idx] = { ...next[idx], ...msg, isInflight: false };
    return next;
  }
  if (!msg.id && !msg.client_msg_id) return list;
  return [...list, msg];
}

function upsertOfflineMessage(list, msg) {
  if (!msg) return list;
  const idx = list.findIndex(
    (item) =>
      (msg.id && String(item.id) === String(msg.id)) ||
      (msg.client_msg_id && item.client_msg_id === msg.client_msg_id)
  );
  if (idx >= 0) {
    const next = [...list];
    next[idx] = { ...next[idx], ...msg, isInflight: false };
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

function ChevronIcon({ open }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={open ? styles.faqChevronOpen : styles.faqChevron}
    >
      <path
        d="M8 10l4 4 4-4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function LiveChat({ locale, area }) {
  const copy = React.useMemo(() => getFaqCopy(locale), [locale]);
  const faqItems = React.useMemo(() => getFaqItems(locale), [locale]);

  const [open, setOpen] = React.useState(false);
  const [view, setView] = React.useState("faq");
  const [expandedFaqId, setExpandedFaqId] = React.useState(null);
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
  const [offlineSession, setOfflineSession] = React.useState(null);
  const [offlineMessages, setOfflineMessages] = React.useState([]);
  const [offlineThreadReady, setOfflineThreadReady] = React.useState(false);
  const [offlineSent, setOfflineSent] = React.useState(false);
  const wsRef = React.useRef(null);
  const pingTimerRef = React.useRef(null);
  const lastIdRef = React.useRef(0);
  const visitorKeyRef = React.useRef("");
  const messagesEndRef = React.useRef(null);
  const isComposingRef = React.useRef(false);
  const openRef = React.useRef(false);
  const viewRef = React.useRef("faq");
  const sessionRef = React.useRef(null);
  const reconnectBlockedRef = React.useRef(false);
  const reconnectTimerRef = React.useRef(null);
  const reconnectAttemptRef = React.useRef(0);
  const connectWsRef = React.useRef(null);

  React.useEffect(() => {
    openRef.current = open;
  }, [open]);

  React.useEffect(() => {
    viewRef.current = view;
  }, [view]);

  React.useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  const isWorkTime = config?.is_work_time !== false;
  const showOfflineBanner = !isWorkTime;
  const welcomeText =
    !showOfflineBanner && (session?.welcome_text || config?.welcome_text || "");
  const closed = session?.status === "closed";

  const scrollToBottom = React.useCallback(() => {
    messagesEndRef.current?.scrollIntoView?.({ behavior: "smooth" });
  }, []);

  const shouldKeepWsAlive = React.useCallback(() => {
    const sess = sessionRef.current;
    return (
      openRef.current &&
      viewRef.current === "chat" &&
      sess?.conversation_id &&
      sess.status !== "closed" &&
      !reconnectBlockedRef.current
    );
  }, []);

  const clearReconnectTimer = React.useCallback(() => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
  }, []);

  const clearPingTimer = React.useCallback(() => {
    if (pingTimerRef.current) {
      clearInterval(pingTimerRef.current);
      pingTimerRef.current = null;
    }
  }, []);

  const disconnectWs = React.useCallback(
    (blockReconnect = true) => {
      if (blockReconnect) {
        reconnectBlockedRef.current = true;
      }
      clearReconnectTimer();
      clearPingTimer();
      const ws = wsRef.current;
      wsRef.current = null;
      if (!ws) return;
      ws.onopen = null;
      ws.onmessage = null;
      ws.onerror = null;
      ws.onclose = null;
      ws.close();
    },
    [clearPingTimer, clearReconnectTimer]
  );

  const scheduleWsReconnect = React.useCallback(
    (sess) => {
      if (!shouldKeepWsAlive()) return;
      clearReconnectTimer();
      const attempt = reconnectAttemptRef.current;
      const delay = Math.min(30000, 1000 * 2 ** attempt);
      reconnectTimerRef.current = setTimeout(async () => {
        reconnectTimerRef.current = null;
        if (!shouldKeepWsAlive()) return;
        try {
          const res = await refreshWsToken({
            conversation_id: sess.conversation_id,
            visitor_key: visitorKeyRef.current,
          });
          if (!shouldKeepWsAlive()) return;
          if (res?.code === 0 && res.data?.ws_token) {
            reconnectAttemptRef.current = attempt + 1;
            connectWsRef.current?.({ ...sess, ws_token: res.data.ws_token });
          }
        } catch (err) {
          console.warn("[LiveChat] ws reconnect failed", err);
          if (shouldKeepWsAlive()) {
            scheduleWsReconnect(sess);
          }
        }
      }, delay);
    },
    [clearReconnectTimer, shouldKeepWsAlive]
  );

  const fetchMissedMessages = React.useCallback(async (conversationId) => {
    if (!conversationId || !visitorKeyRef.current) return;
    try {
      const res = await getChatMessages({
        conversation_id: conversationId,
        visitor_key: visitorKeyRef.current,
        after_id: lastIdRef.current,
      });
      if (res?.code === 0 && Array.isArray(res.data) && res.data.length) {
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
      console.warn("[LiveChat] fetch missed messages failed", err);
    }
  }, []);

  const connectWs = React.useCallback(
    async (sess) => {
      if (!sess?.ws_token || !sess?.conversation_id) return;

      reconnectBlockedRef.current = false;
      clearReconnectTimer();

      const prev = wsRef.current;
      if (prev) {
        prev.onopen = null;
        prev.onmessage = null;
        prev.onerror = null;
        prev.onclose = null;
        prev.close();
      }

      const url = `${getWsBaseUrl()}/ws/visitor?token=${encodeURIComponent(sess.ws_token)}`;
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        if (wsRef.current !== ws) return;
        reconnectAttemptRef.current = 0;
        clearPingTimer();
        pingTimerRef.current = setInterval(() => {
          if (wsRef.current === ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: "ping" }));
          }
        }, 30000);
        fetchMissedMessages(sess.conversation_id);
      };

      ws.onmessage = (evt) => {
        if (wsRef.current !== ws) return;
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

      ws.onclose = () => {
        if (wsRef.current !== ws) return;
        wsRef.current = null;
        if (!shouldKeepWsAlive()) return;
        scheduleWsReconnect(sess);
      };
    },
    [clearPingTimer, clearReconnectTimer, fetchMissedMessages, scheduleWsReconnect, shouldKeepWsAlive]
  );

  connectWsRef.current = connectWs;

  const loadConfig = React.useCallback(async () => {
    try {
      const cfgRes = await getChatConfig();
      if (cfgRes?.code !== 0) return;
      setConfig(cfgRes.data);
    } catch (err) {
      console.warn("[LiveChat] load config failed", err);
    }
  }, []);

  const startLiveChat = React.useCallback(async () => {
    setLoading(true);
    try {
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
      } else {
        lastIdRef.current = 0;
      }
      setView("chat");
      await connectWs(sess);
      return sess;
    } catch (err) {
      console.warn("[LiveChat] start live chat failed", err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [area, connectWs, locale]);

  const handleStartNewChat = React.useCallback(async () => {
    reconnectBlockedRef.current = false;
    return startLiveChat();
  }, [startLiveChat]);

  const loadOfflineThread = React.useCallback(async (conversationId) => {
    if (!conversationId || !visitorKeyRef.current) return;
    try {
      const res = await getOfflineThread({
        conversation_id: conversationId,
        visitor_key: visitorKeyRef.current,
      });
      if (res?.code === 0 && Array.isArray(res.data)) {
        setOfflineMessages(res.data);
        setOfflineThreadReady(true);
      }
    } catch (err) {
      console.warn("[LiveChat] load offline thread failed", err);
    }
  }, []);

  const ensureOfflineSession = React.useCallback(async (email, phone) => {
    const visitorKey = getVisitorKey();
    visitorKeyRef.current = visitorKey;
    try {
      const res = await createOfflineSession({
        visitor_key: visitorKey,
        email: email.trim(),
        phone: phone.trim(),
        locale: locale || "en",
        area: area || Cookies.get("area") || "us",
        page_url: typeof window !== "undefined" ? window.location.href : "",
      });
      if (res?.code !== 0) return null;
      const sess = res.data;
      setOfflineSession(sess);
      setOfflineMessages(Array.isArray(sess.messages) ? sess.messages : []);
      const hasThread =
        !!sess.conversation_id || (Array.isArray(sess.messages) && sess.messages.length > 0);
      setOfflineThreadReady(hasThread);
      if (sess.conversation_id) {
        await loadOfflineThread(sess.conversation_id);
      }
      return sess;
    } catch (err) {
      console.warn("[LiveChat] create offline session failed", err);
      return null;
    }
  }, [area, loadOfflineThread, locale]);

  const handleTransferToAgent = React.useCallback(async () => {
    let cfg = config;
    if (!cfg) {
      try {
        const cfgRes = await getChatConfig();
        if (cfgRes?.code !== 0) return;
        cfg = cfgRes.data;
        setConfig(cfg);
      } catch (err) {
        console.warn("[LiveChat] load config failed", err);
        return;
      }
    }
    if (!cfg?.enabled) return;

    const online = cfg.is_work_time !== false;
    if (online) {
      if (session?.conversation_id && session.status !== "closed") {
        setView("chat");
        return;
      }
      await startLiveChat();
      return;
    }
    setView("offline");
    setOfflineSent(false);
    if (offline.email.trim()) {
      await ensureOfflineSession(offline.email, offline.phone);
    }
  }, [config, ensureOfflineSession, offline.email, offline.phone, session, startLiveChat]);

  const handleTransferRef = React.useRef(handleTransferToAgent);
  handleTransferRef.current = handleTransferToAgent;

  React.useEffect(() => {
    registerLiveChatOpen((forceOpen) => {
      setOpen(true);
      if (forceOpen) {
        handleTransferRef.current();
      }
    });
    loadConfig();
    return () => {
      registerLiveChatOpen(null);
      disconnectWs(true);
    };
  }, [disconnectWs, loadConfig]);

  React.useEffect(() => {
    if (!open || view !== "chat" || !session?.conversation_id || !visitorKeyRef.current) {
      return;
    }
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
  }, [open, session?.conversation_id, view]);

  React.useEffect(() => {
    if (open && (view === "chat" || view === "offline")) {
      scrollToBottom();
    }
  }, [open, view, messages, offlineMessages, scrollToBottom]);

  const handleSend = async () => {
    const body = input.trim();
    if (!body) return;
    let activeSession = session;
    if (!activeSession?.conversation_id || closed) {
      activeSession = await handleStartNewChat();
      if (!activeSession?.conversation_id) return;
    }
    const clientMsgId = uuid();
    const optimistic = {
      client_msg_id: clientMsgId,
      sender_type: "visitor",
      body,
      isInflight: true,
    };
    setMessages((prev) => upsertMessage(prev, optimistic));
    setInput("");
    try {
      const res = await sendChatMessage({
        conversation_id: activeSession.conversation_id,
        visitor_key: visitorKeyRef.current,
        body,
        client_msg_id: clientMsgId,
      });
      if (res?.code === 0) {
        setMessages((prev) => upsertMessage(prev, { ...res.data, client_msg_id: clientMsgId }));
        if (res.data?.id) {
          lastIdRef.current = Math.max(lastIdRef.current, Number(res.data.id));
        }
      } else {
        setMessages((prev) =>
          prev.filter((m) => m.client_msg_id !== clientMsgId)
        );
      }
    } catch (err) {
      setMessages((prev) =>
        prev.filter((m) => m.client_msg_id !== clientMsgId)
      );
      console.warn("[LiveChat] send failed", err);
    }
  };

  const handleOfflineSend = async () => {
    const content = offline.content.trim();
    if (!content) return;
    const email = offline.email.trim();
    if (!email) return;

    let sess = offlineSession;
    if (!sess) {
      sess = await ensureOfflineSession(email, offline.phone);
      if (!sess) return;
    }

    const clientMsgId = uuid();
    const optimistic = {
      client_msg_id: clientMsgId,
      sender_type: "visitor",
      body: content,
      isInflight: true,
    };
    setOfflineMessages((prev) => upsertOfflineMessage(prev, optimistic));
    setOffline((s) => ({ ...s, content: "" }));
    setOfflineThreadReady(true);

    try {
      const res = await sendOfflineMessage({
        conversation_id: sess.conversation_id || undefined,
        visitor_key: visitorKeyRef.current,
        email,
        phone: offline.phone.trim(),
        content,
        client_msg_id: clientMsgId,
        locale: locale || "en",
        area: area || Cookies.get("area") || "us",
        page_url: typeof window !== "undefined" ? window.location.href : "",
      });
      if (res?.code === 0) {
        setOfflineMessages((prev) =>
          upsertOfflineMessage(prev, { ...res.data, client_msg_id: clientMsgId })
        );
        if (res.data?.conversation_id) {
          setOfflineSession((prev) => ({
            ...(prev || sess),
            conversation_id: res.data.conversation_id,
          }));
        }
      } else {
        setOfflineMessages((prev) =>
          prev.filter((m) => m.client_msg_id !== clientMsgId)
        );
      }
    } catch (err) {
      setOfflineMessages((prev) =>
        prev.filter((m) => m.client_msg_id !== clientMsgId)
      );
      console.warn("[LiveChat] offline send failed", err);
    }
  };

  const handleOfflineSubmit = async () => {
    const email = offline.email.trim();
    const content = offline.content.trim();
    if (!email || !content) return;
    await ensureOfflineSession(email, offline.phone);
    await handleOfflineSend();
  };

  const closePanel = () => {
    disconnectWs(true);
    setOpen(false);
    setView("faq");
    setExpandedFaqId(null);
  };

  const goBackToFaq = () => {
    disconnectWs(true);
    setView("faq");
    setExpandedFaqId(null);
    setOfflineSent(false);
    setOfflineThreadReady(false);
    setOfflineSession(null);
    setOfflineMessages([]);
  };

  const openPanel = () => {
    setOpen(true);
    setView("faq");
    setExpandedFaqId(null);
    loadConfig();
  };

  const renderHeader = (title, statusText, online = true, showBack = false) => (
    <div className={styles.header}>
      <div className={styles.headerInner}>
        {showBack ? (
          <button
            type="button"
            className={styles.headerBack}
            aria-label={copy.backToFaq}
            onClick={goBackToFaq}
          >
            ‹
          </button>
        ) : null}
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

  const renderFaqView = () => (
    <>
      {renderHeader(
        copy.panelTitle,
        isWorkTime ? copy.panelStatusOnline : copy.panelStatusOffline,
        isWorkTime
      )}
      <div className={styles.body}>
        <div className={styles.faqScroll}>
          <p className={styles.faqIntro}>{copy.intro}</p>
          <ul className={styles.faqList}>
            {faqItems.map((item) => {
              const expanded = expandedFaqId === item.id;
              return (
                <li key={item.id} className={styles.faqItem}>
                  <button
                    type="button"
                    className={styles.faqQuestion}
                    aria-expanded={expanded}
                    onClick={() =>
                      setExpandedFaqId(expanded ? null : item.id)
                    }
                  >
                    <span>{item.question}</span>
                    <ChevronIcon open={expanded} />
                  </button>
                  {expanded ? (
                    <div className={styles.faqAnswer}>{item.answer}</div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </div>
        <div className={styles.faqFooter}>
          <button
            type="button"
            className={styles.transferBtn}
            disabled={loading || config?.enabled === false}
            onClick={handleTransferToAgent}
          >
            {copy.transferBtn}
          </button>
        </div>
      </div>
    </>
  );

  const renderOfflineView = () => (
    <>
      {renderHeader(
        copy.panelTitle,
        offlineThreadReady ? copy.panelStatusOffline : offlineSent ? copy.offlineSuccessTitle : copy.panelStatusOffline,
        false,
        true
      )}
      <div className={styles.body}>
        {offlineThreadReady ? (
          <>
            <div className={styles.messages}>
              <div className={styles.offlineBanner}>{copy.offlineBanner}</div>
              {offlineMessages.map((msg) => {
                const isVisitor = msg.sender_type === "visitor";
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
                      {msg.created_time && !msg.isInflight ? (
                        <div className={styles.time}>
                          {formatMsgTime(msg.created_time)}
                        </div>
                      ) : (
                        <div className={styles.time}>&nbsp;</div>
                      )}
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
            <div className={styles.footer}>
              <div className={styles.inputWrap}>
                <div className={styles.inputBox}>
                  <input
                    className={styles.input}
                    value={offline.content}
                    placeholder={copy.offlineThreadPlaceholder}
                    onChange={(e) =>
                      setOffline((s) => ({ ...s, content: e.target.value }))
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleOfflineSend();
                      }
                    }}
                  />
                </div>
                <button
                  type="button"
                  className={styles.sendBtnRound}
                  aria-label="Send offline message"
                  disabled={!offline.content.trim()}
                  onClick={handleOfflineSend}
                >
                  <SendIcon />
                </button>
              </div>
            </div>
          </>
        ) : offlineSent ? (
          <div className={styles.successCard}>
            <div className={styles.successIcon}>
              <CheckIcon />
            </div>
            <div className={styles.successTitle}>{copy.offlineSuccessTitle}</div>
            <div className={styles.successText}>{copy.offlineSuccessText}</div>
          </div>
        ) : (
          <>
            <div className={styles.offlineScroll}>
              <p className={styles.offlineIntro}>{copy.offlineIntro}</p>
              <div className={styles.offlineForm}>
                <div className={styles.formField}>
                  <label className={styles.formLabel} htmlFor="chat-offline-email">
                    {copy.email}
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
                    {copy.phone}
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
                    {copy.message}
                  </label>
                  <textarea
                    id="chat-offline-content"
                    className={styles.formTextarea}
                    rows={4}
                    placeholder=""
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
              {copy.submit}
            </button>
          </>
        )}
      </div>
    </>
  );

  const renderChatView = () => (
    <>
      {renderHeader(
        BRAND_NAME,
        closed ? copy.chatEnded : copy.chatOnline,
        !closed,
        true
      )}
      <div className={styles.body}>
        <div className={styles.messages}>
          {showOfflineBanner ? (
            <div className={styles.offlineBanner}>{copy.offlineBanner}</div>
          ) : null}
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
                      {msg.body === CHAT_END_BODY ? copy.chatEnded : msg.body}
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
                  {msg.created_time && !msg.isInflight ? (
                    <div className={styles.time}>
                      {formatMsgTime(msg.created_time)}
                    </div>
                  ) : msg.isInflight ? (
                    <div className={styles.time}>&nbsp;</div>
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
            <div className={styles.closedFooter}>
              <div className={styles.hint}>{copy.chatEndedHint}</div>
              <button
                type="button"
                className={styles.transferBtn}
                disabled={loading}
                onClick={handleStartNewChat}
              >
                {copy.startNewChat}
              </button>
            </div>
          ) : (
            <div className={styles.inputWrap}>
              <div className={styles.inputBox}>
                <input
                  className={styles.input}
                  value={input}
                  placeholder={copy.typePlaceholder}
                  onChange={(e) => setInput(e.target.value)}
                  onCompositionStart={() => {
                    isComposingRef.current = true;
                  }}
                  onCompositionEnd={() => {
                    isComposingRef.current = false;
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      if (isComposingRef.current || e.nativeEvent.isComposing) {
                        return;
                      }
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
  );

  if (config && config.enabled === false) return null;

  return (
    <div className={styles.wrapper}>
      {open && (
        <div className={styles.panel} role="dialog" aria-label="Live chat">
          {view === "faq" ? renderFaqView() : null}
          {view === "offline" ? renderOfflineView() : null}
          {view === "chat" ? renderChatView() : null}
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
          openPanel();
        }}
      >
        <ChatBubbleIcon />
        <span
          className={`${styles.toggleDot} ${!isWorkTime ? styles.toggleDotOffline : ""}`}
          aria-hidden="true"
        />
      </button>
    </div>
  );
}

export { openLiveChat };
