"use client";

import React from "react";
import Link from "next/link";
import Cookies from "js-cookie";
import Compressor from "compressorjs";
import styles from "./index.module.scss";
import {
  createChatSession,
  evaluateChat,
  fetchChatConfig,
  getChatEvaluation,
  getChatFaq,
  getChatMessages,
  peekChatConfig,
  refreshWsToken,
  sendChatMessage,
  sendOfflineMessage,
  startChatApiKeepalive,
  stopChatApiKeepalive,
  uploadChatFile,
} from "./api";
import { getFaqCopy, getFaqItems } from "./faq";
import openLiveChat, { registerLiveChatOpen } from "./openLiveChat";
import OrderPicker, { getOrderStatusText } from "./orderPicker";
import ProductPicker from "./productPicker";

const VISITOR_KEY = "boldradiant_chat_visitor_key";
const LEAD_KEY = "boldradiant_chat_lead";
const CONV_KEY = "boldradiant_chat_conversation_id";
const UNREAD_KEY = "boldradiant_chat_last_read_id";
const CHAT_END_BODY = "__CHAT_END__";
const BRAND_NAME = "BoldRadiant";
const MOBILE_PANEL_CLOSE_MS = 280;
// 上传：accept 列表与图片判定（对标 herodash guest），10MB 上限与后端一致
const UPLOAD_ACCEPT =
  ".jpg,.jpeg,.png,.gif,.webp,.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.xlsm,.ods,.csv,.txt,.zip,.rar";
const IMAGE_EXT_RE = /\.(jpe?g|png|gif|webp)$/i;
const UPLOAD_MAX_SIZE = 10 * 1024 * 1024;
// 满意度评价：五级表情，索引 0~4 对应 rating 1~5
const RATING_EMOJIS = ["😞", "🙁", "😐", "🙂", "😄"];

function getStoredConversationId() {
  if (typeof window === "undefined") return 0;
  const raw = localStorage.getItem(CONV_KEY);
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

function setStoredConversationId(id) {
  if (typeof window === "undefined") return;
  try {
    if (id) localStorage.setItem(CONV_KEY, String(id));
    else localStorage.removeItem(CONV_KEY);
  } catch (err) {
    // ignore quota
  }
}

// 未读读游标：持久化到 localStorage，刷新后 seed lastReadIdRef，
// 避免未读徽标把全部历史客服消息重新计一遍。
function getStoredLastReadId() {
  if (typeof window === "undefined") return 0;
  const raw = localStorage.getItem(UNREAD_KEY);
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

function setStoredLastReadId(id) {
  if (typeof window === "undefined") return;
  try {
    if (id) localStorage.setItem(UNREAD_KEY, String(id));
    else localStorage.removeItem(UNREAD_KEY);
  } catch (err) {
    // ignore quota/privacy errors
  }
}

function getVisitorKey() {
  if (typeof window === "undefined") return "";
  let key = localStorage.getItem(VISITOR_KEY);
  if (!key) {
    key =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `v_${Date.now()}_${Math.random().toString(16).slice(2)}`;
    // 隐私/禁存储模式下 setItem 会抛错，try/catch 保证会话不中断（对齐 saveLead 写法）
    try {
      localStorage.setItem(VISITOR_KEY, key);
    } catch (err) {
      // ignore quota/privacy errors — 本次会话内存持有该 key 即可
    }
  }
  return key;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isValidEmail(value) {
  return EMAIL_RE.test(String(value || "").trim());
}

function loadLead() {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(LEAD_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && parsed.name && isValidEmail(parsed.email)) {
      return { name: String(parsed.name), email: String(parsed.email) };
    }
  } catch (err) {
    // ignore malformed storage
  }
  return null;
}

function saveLead(lead) {
  if (typeof window === "undefined" || !lead) return;
  try {
    localStorage.setItem(
      LEAD_KEY,
      JSON.stringify({ name: lead.name, email: lead.email })
    );
  } catch (err) {
    // ignore quota errors
  }
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

// 排序键：优先真实 id（升序），无 id 的乐观消息（刚发出、isInflight）排到末尾并保持插入顺序。
// 无 id 但有 created_time 的用时间戳兜底。
function msgSortKey(m) {
  const id = Number(m?.id) || 0;
  if (id) return id;
  const ts = m?.created_time ? Date.parse(String(m.created_time).replace(" ", "T")) : NaN;
  if (Number.isFinite(ts)) return ts;
  return Number.MAX_SAFE_INTEGER;
}

function upsertMessage(list, msg) {
  if (!msg) return list;
  const idx = list.findIndex(
    (item) =>
      (msg.id && String(item.id) === String(msg.id)) ||
      (msg.client_msg_id && item.client_msg_id === msg.client_msg_id)
  );
  let next;
  if (idx >= 0) {
    next = [...list];
    next[idx] = { ...next[idx], ...msg, isInflight: false };
  } else {
    if (!msg.id && !msg.client_msg_id) return list;
    next = [...list, msg];
  }
  // poll/WS 交错到达可能乱序（如 [8,11,9,10]），upsert 后按 id 稳定升序排序再渲染。
  // Array.prototype.sort 在现代引擎稳定，相等键保持原插入顺序。
  next.sort((a, b) => msgSortKey(a) - msgSortKey(b));
  return next;
}

function formatMsgTime(value) {
  if (!value) return "";
  let normalized = String(value).trim().replace(" ", "T");
  // 服务端返回的是无时区偏移的北京(+08)裸时间字符串（如 "2026-07-04T15:30:00"）。
  // 直接 new Date 会被浏览器当本地时间解析 → 美区访客偏 ~13h。
  // 已带时区标记（Z 或 ±HH:MM / ±HHMM）的字符串保持原样，其余按 +08:00 归一后再本地化展示。
  if (!/(?:[zZ]|[+-]\d{2}:?\d{2})$/.test(normalized)) {
    normalized += "+08:00";
  }
  const d = new Date(normalized);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

// 取坐席姓名首字母作头像（支持多词取前两词首字母），无姓名时返回空
function getNameInitials(name) {
  const trimmed = String(name || "").trim();
  if (!trimmed) return "";
  const parts = trimmed.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return trimmed.slice(0, 2).toUpperCase();
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

function AttachIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M8 12.5l6.5-6.5a3 3 0 0 1 4.24 4.24l-8.13 8.13a4.5 4.5 0 0 1-6.36-6.36l7.78-7.78"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function FileIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M13 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V9l-6-6Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M13 3v6h6" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  );
}

function OrderIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M6 4h9l3 3v13a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M8.5 10.5h7M8.5 14h7M8.5 17h4"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ProductIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M5 8h14l-1 11a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1L5 8Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M9 8a3 3 0 0 1 6 0"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
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
  // FAQ 优先用后端配置，拉取失败/为空时回退写死兜底，前台永不空白
  const fallbackFaq = React.useMemo(() => getFaqItems(locale), [locale]);
  const [faqItems, setFaqItems] = React.useState(fallbackFaq);

  React.useEffect(() => {
    let cancelled = false;
    getChatFaq(locale)
      .then((res) => {
        if (cancelled) return;
        const list = res?.data;
        if (Array.isArray(list) && list.length > 0) {
          setFaqItems(
            list.map((it) => ({
              id: it.key,
              question: it.question,
              answer: it.answer,
            }))
          );
        } else {
          setFaqItems(fallbackFaq);
        }
      })
      .catch(() => {
        // 接口失败保持兜底，不打断
      });
    return () => {
      cancelled = true;
    };
  }, [locale, fallbackFaq]);

  const [open, setOpen] = React.useState(false);
  const [panelClosing, setPanelClosing] = React.useState(false);
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
  const [offlineSent, setOfflineSent] = React.useState(false);
  const [offlineSubmitting, setOfflineSubmitting] = React.useState(false);
  // 文件/图片上传
  const [uploading, setUploading] = React.useState(false);
  const fileInputRef = React.useRef(null);
  // Phase 2 订单分享：登录态（token cookie）决定入口可见，picker 控制选择器开关
  const [isLoggedIn, setIsLoggedIn] = React.useState(false);
  const [orderPickerOpen, setOrderPickerOpen] = React.useState(false);
  const [sendError, setSendError] = React.useState("");
  // 商品分享选择器（购物车/最近浏览/搜索三来源，全客户端，无需登录）
  const [productPickerOpen, setProductPickerOpen] = React.useState(false);
  // 切片3 满意度评价：rated 已评价态、rating 选中分值(1~5)、feedback 反馈文本
  const [evaluation, setEvaluation] = React.useState({
    rated: false,
    rating: 0,
    feedback: "",
  });
  const [ratingSelected, setRatingSelected] = React.useState(0);
  const [ratingFeedback, setRatingFeedback] = React.useState("");
  const [ratingSubmitting, setRatingSubmitting] = React.useState(false);
  // 未读消息数（面板未开或不在 chat 视图时累计，客服来消息时亮红点）
  const [unread, setUnread] = React.useState(0);
  const lastReadIdRef = React.useRef(0);
  // 坐席「正在输入」指示：收到 typing 事件即点亮，3s 无新事件自动熄灭
  const [agentTyping, setAgentTyping] = React.useState(false);
  const agentTypingTimerRef = React.useRef(null);
  const lastTypingSentRef = React.useRef(0);
  // 进入人工客服前收集的访客身份（姓名 + 邮箱）
  const [lead, setLead] = React.useState(() => loadLead());
  const [leadForm, setLeadForm] = React.useState(
    () => loadLead() || { name: "", email: "" }
  );
  const [leadError, setLeadError] = React.useState({ name: "", email: "" });
  const leadRef = React.useRef(null);
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
  const closePanelTimerRef = React.useRef(null);

  React.useEffect(() => {
    openRef.current = open;
  }, [open]);

  React.useEffect(() => {
    viewRef.current = view;
  }, [view]);

  React.useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  React.useEffect(() => {
    leadRef.current = lead;
  }, [lead]);

  // mount 时 seed 已读游标：刷新后未读徽标从上次已读位起算，
  // 而非把全部历史客服消息重新计一遍。
  React.useEffect(() => {
    lastReadIdRef.current = getStoredLastReadId();
  }, []);

  // 登录态：token cookie 存在即视为已登录（与站内 RightArea/AfterSale 同口径）；
  // 面板打开时刷新一次，覆盖打开聊天前刚登录/登出的情况。
  React.useEffect(() => {
    setIsLoggedIn(!!Cookies.get("token"));
  }, [open]);

  const isWorkTime = config?.is_work_time !== false;
  const showOfflineBanner = !isWorkTime;
  const welcomeText =
    !showOfflineBanner && (session?.welcome_text || config?.welcome_text || "");
  const closed = session?.status === "closed";
  // 切片3：最后一条结束系统消息(__CHAT_END__)的下标，满意度评价内联锚定其后随历史留存
  const lastEndIdx = (() => {
    for (let i = messages.length - 1; i >= 0; i -= 1) {
      const m = messages[i];
      if (m.msg_type === "system" || m.body === CHAT_END_BODY) return i;
    }
    return -1;
  })();

  // 外观配置（来自渠道 /chat/config；字段为空时回退内置默认，保证零回归）
  const logoUrl = config?.logo_url || "";
  const headerTitle = config?.title || copy.panelTitle;
  const chatTitle = config?.title || BRAND_NAME;
  const bubbleLeft = config?.bubble_position === "left";
  const primaryColor = config?.primary_color || "";
  const wrapperStyle = primaryColor
    ? { "--lc-brand-dark": primaryColor, "--lc-brand-mid": primaryColor }
    : undefined;
  // 头像渲染：
  // - 品牌头像（header / 无坐席姓名）：优先 logo_url，回退 "BR"
  // - 坐席个人头像（传入 senderName）：用姓名首字母，无姓名时回退品牌逻辑
  const renderAvatar = (className, senderName) => {
    const initials = getNameInitials(senderName);
    if (initials) {
      return (
        <div className={className} aria-hidden="true">
          {initials}
        </div>
      );
    }
    return (
      <div className={className} aria-hidden="true">
        {logoUrl ? <img src={logoUrl} alt="" /> : "BR"}
      </div>
    );
  };

  const scrollToBottom = React.useCallback(() => {
    messagesEndRef.current?.scrollIntoView?.({ behavior: "smooth" });
  }, []);

  // 访客输入时向坐席发「正在输入」心跳（节流 ~2s，坐席端 3s 自动熄灭）
  const sendTypingSignal = React.useCallback(() => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    const now = Date.now();
    if (now - lastTypingSentRef.current < 2000) return;
    lastTypingSentRef.current = now;
    try {
      ws.send(JSON.stringify({ type: "typing" }));
    } catch (err) {
      /* ws 已断开，忽略 */
    }
  }, []);

  // 收到坐席 typing 事件：点亮指示并重置 3s 熄灭定时器
  const markAgentTyping = React.useCallback(() => {
    setAgentTyping(true);
    if (agentTypingTimerRef.current) clearTimeout(agentTypingTimerRef.current);
    agentTypingTimerRef.current = setTimeout(() => {
      setAgentTyping(false);
      agentTypingTimerRef.current = null;
    }, 3000);
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
          } else {
            // 业务错误（code≠0，如 token 暂时签发失败）不静默永停，
            // 递增退避后继续重试，否则 WS 会永久断线只能靠轮询兜底。
            reconnectAttemptRef.current = attempt + 1;
            if (shouldKeepWsAlive()) {
              scheduleWsReconnect(sess);
            }
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
              // ws 仅在 chat 视图存活，收到即视为已读
              if (openRef.current && viewRef.current === "chat") {
                lastReadIdRef.current = lastIdRef.current;
                setStoredLastReadId(lastReadIdRef.current);
                setUnread(0);
              }
            }
          }
          if (frame.type === "conversation.updated" && frame.data?.status) {
            setSession((prev) => (prev ? { ...prev, status: frame.data.status } : prev));
          }
          if (frame.type === "typing" && frame.data?.from === "agent") {
            markAgentTyping();
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
    [clearPingTimer, clearReconnectTimer, fetchMissedMessages, markAgentTyping, scheduleWsReconnect, shouldKeepWsAlive]
  );

  connectWsRef.current = connectWs;

  const loadConfig = React.useCallback(async (options = {}) => {
    const { force = false } = options;
    try {
      const cfgRes = await fetchChatConfig({ force });
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
      const currentLead = leadRef.current;
      const sessRes = await createChatSession({
        visitor_key: visitorKey,
        visitor_name: currentLead?.name || undefined,
        visitor_email: currentLead?.email || undefined,
        locale: locale || "en",
        area: areaCode,
        page_url: typeof window !== "undefined" ? window.location.href : "",
      });
      if (sessRes?.code !== 0) return;
      const sess = sessRes.data;
      setSession(sess);
      setStoredConversationId(sess.conversation_id);
      setMessages(Array.isArray(sess.messages) ? sess.messages : []);
      if (sess.messages?.length) {
        lastIdRef.current = Math.max(
          ...sess.messages.map((m) => Number(m.id) || 0),
          0
        );
      } else {
        lastIdRef.current = 0;
      }
      lastReadIdRef.current = lastIdRef.current;
      setStoredLastReadId(lastReadIdRef.current);
      setUnread(0);
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
    // 新会话重置评价状态，避免沿用上一会话的已评价态
    setEvaluation({ rated: false, rating: 0, feedback: "" });
    setRatingSelected(0);
    setRatingFeedback("");
    return startLiveChat();
  }, [startLiveChat]);

  // 恢复历史会话：用存储的 conversation_id 拉消息，直接进 chat 视图（含已关闭会话看历史）
  const resumeChat = React.useCallback(async (conversationId) => {
    const visitorKey = getVisitorKey();
    visitorKeyRef.current = visitorKey;
    try {
      const res = await getChatMessages({
        conversation_id: conversationId,
        visitor_key: visitorKey,
        after_id: 0,
      });
      if (res?.code !== 0 || !Array.isArray(res.data)) return false;
      const msgs = res.data;
      const maxId = msgs.reduce((m, x) => Math.max(m, Number(x.id) || 0), 0);
      // 历史里出现结束系统消息则视为已关闭，展示"开始新会话"
      const ended = msgs.some(
        (m) => m.msg_type === "system" || m.body === CHAT_END_BODY
      );
      const sess = {
        conversation_id: conversationId,
        visitor_key: visitorKey,
        status: ended ? "closed" : "active",
        messages: msgs,
      };
      setSession(sess);
      setMessages(msgs);
      lastIdRef.current = maxId;
      lastReadIdRef.current = maxId;
      setStoredLastReadId(lastReadIdRef.current);
      setUnread(0);
      setView("chat");
      reconnectBlockedRef.current = false;
      // 已关闭会话不必连 ws
      if (ended) return true;
      const tokenRes = await refreshWsToken({
        conversation_id: conversationId,
        visitor_key: visitorKey,
      });
      if (tokenRes?.code === 0 && tokenRes.data?.ws_token) {
        await connectWs({ ...sess, ws_token: tokenRes.data.ws_token });
      }
      return true;
    } catch (err) {
      console.warn("[LiveChat] resume chat failed", err);
      return false;
    }
  }, [connectWs]);

  // 切回聊天视图时确保 WS 在线：closePanel / goBackToFaq 会主动断开并阻止重连，
  // 重新进入聊天必须用最新 token 重建连接，否则只能靠轮询兜底、实时消息会延迟十几秒。
  const ensureWsConnected = React.useCallback(
    async (sess) => {
      if (!sess?.conversation_id || sess.status === "closed") return;
      const ws = wsRef.current;
      if (
        ws &&
        (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)
      ) {
        return;
      }
      reconnectBlockedRef.current = false;
      if (!visitorKeyRef.current) {
        visitorKeyRef.current = getVisitorKey();
      }
      try {
        const res = await refreshWsToken({
          conversation_id: sess.conversation_id,
          visitor_key: visitorKeyRef.current,
        });
        if (res?.code === 0 && res.data?.ws_token) {
          await connectWs({ ...sess, ws_token: res.data.ws_token });
        }
      } catch (err) {
        console.warn("[LiveChat] ensure ws failed", err);
      }
    },
    [connectWs]
  );

  const proceedToAgent = React.useCallback(async () => {
    let cfg = config;
    if (!cfg) {
      try {
        const cfgRes = await fetchChatConfig();
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
        ensureWsConnected(session);
        return;
      }
      await startLiveChat();
      return;
    }
    // 非工作时段：进行中会话（未关闭）仍回聊天视图续聊，勿丢进留言表单（对齐 online 分支）。
    if (session?.conversation_id && session.status !== "closed") {
      setView("chat");
      ensureWsConnected(session);
      return;
    }
    setView("offline");
    setOfflineSent(false);
    const presetEmail = leadRef.current?.email || "";
    if (presetEmail && !offline.email) {
      setOffline((s) => ({ ...s, email: presetEmail }));
    }
  }, [config, offline.email, session, startLiveChat, ensureWsConnected]);

  // 进入人工客服前先收集访客姓名 + 邮箱；已留过则直接进入
  const handleTransferToAgent = React.useCallback(async () => {
    if (leadRef.current) {
      await proceedToAgent();
      return;
    }
    setLeadError({ name: "", email: "" });
    setView("lead");
  }, [proceedToAgent]);

  const handleLeadSubmit = React.useCallback(async () => {
    const name = leadForm.name.trim();
    const email = leadForm.email.trim();
    const nextError = {
      name: name ? "" : copy.invalidName,
      email: isValidEmail(email) ? "" : copy.invalidEmail,
    };
    setLeadError(nextError);
    if (nextError.name || nextError.email) return;

    const nextLead = { name, email };
    setLead(nextLead);
    leadRef.current = nextLead;
    saveLead(nextLead);
    setOffline((s) => ({ ...s, email }));
    await proceedToAgent();
  }, [copy.invalidEmail, copy.invalidName, leadForm.email, leadForm.name, proceedToAgent]);

  const handleTransferRef = React.useRef(handleTransferToAgent);
  handleTransferRef.current = handleTransferToAgent;
  // openPanel 定义在后面，用 ref 让外部 openLiveChat 入口也能走完整的"恢复历史会话 + 重连 WS"逻辑
  const openPanelRef = React.useRef(null);

  React.useEffect(() => {
    registerLiveChatOpen((forceOpen) => {
      if (forceOpen) {
        // 站内"直接转人工"：进入 lead gate / 在线会话（proceedToAgent 内已重连 WS）
        setOpen(true);
        handleTransferRef.current();
      } else {
        // 站内"打开客服"：走 openPanel，恢复历史会话并重连 WS，与气泡按钮一致
        openPanelRef.current?.();
      }
    });
    loadConfig();
    startChatApiKeepalive();
    return () => {
      registerLiveChatOpen(null);
      stopChatApiKeepalive();
      disconnectWs(true);
      if (closePanelTimerRef.current) {
        clearTimeout(closePanelTimerRef.current);
      }
      if (agentTypingTimerRef.current) {
        clearTimeout(agentTypingTimerRef.current);
      }
    };
  }, [disconnectWs, loadConfig]);

  // 会话存在期间持续轮询新消息：面板关闭/不在 chat 视图时累计未读并亮红点；
  // 正在看 chat 时直接并入消息并推进已读位。
  React.useEffect(() => {
    const convId = session?.conversation_id || getStoredConversationId();
    if (!convId || closed) {
      return;
    }
    let timer = null;
    const poll = async () => {
      if (!visitorKeyRef.current) {
        visitorKeyRef.current = getVisitorKey();
      }
      try {
        const res = await getChatMessages({
          conversation_id: convId,
          visitor_key: visitorKeyRef.current,
          after_id: lastIdRef.current,
        });
        if (res?.code !== 0 || !Array.isArray(res.data) || res.data.length === 0) {
          return;
        }
        const viewingChat = openRef.current && viewRef.current === "chat";
        let agentIncoming = 0;
        res.data.forEach((msg) => {
          const mid = Number(msg.id) || 0;
          lastIdRef.current = Math.max(lastIdRef.current, mid);
          if (msg.sender_type === "agent" && mid > lastReadIdRef.current) {
            agentIncoming += 1;
          }
        });
        setMessages((prev) => {
          let next = prev;
          res.data.forEach((msg) => {
            next = upsertMessage(next, msg);
          });
          return next;
        });
        if (viewingChat) {
          lastReadIdRef.current = lastIdRef.current;
          setStoredLastReadId(lastReadIdRef.current);
          setUnread(0);
        } else if (agentIncoming > 0) {
          setUnread((n) => n + agentIncoming);
        }
        // 会话已结束（历史含结束系统消息）且当前无活跃会话（session=null，
        // 此时 closed 恒为 false 无法拦截）→ 停止无谓轮询，避免死轮询已关闭会话。
        const sess = sessionRef.current;
        const ended = res.data.some(
          (m) => m.msg_type === "system" || m.body === CHAT_END_BODY
        );
        if (ended && (!sess || sess.status === "closed")) {
          if (timer) {
            clearInterval(timer);
            timer = null;
          }
        }
      } catch (err) {
        // ignore polling errors
      }
    };
    const interval = openRef.current && viewRef.current === "chat" ? 15000 : 20000;
    timer = setInterval(poll, interval);
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [open, session?.conversation_id, view, closed]);

  React.useEffect(() => {
    if (open && view === "chat") {
      scrollToBottom();
    }
  }, [open, view, messages, scrollToBottom]);

  // 续聊：访客向已结束会话再发消息时复用同一会话（不另开新会话）。
  // 后端 SendVisitorChatMessage 落库时把 closed 复位 waiting；前端先本地复位状态退出结束态、重连 WS，
  // 保留 evaluation/messages 不重置，使已评价留痕与历史消息留在同一聊天流。
  const reopenClosedChat = React.useCallback(
    async (sess) => {
      reconnectBlockedRef.current = false;
      const reopened = { ...sess, status: "waiting" };
      setSession(reopened);
      await ensureWsConnected(reopened);
      return reopened;
    },
    [ensureWsConnected]
  );

  const handleSend = async () => {
    const body = input.trim();
    if (!body) return;
    let activeSession = session;
    if (!activeSession?.conversation_id) {
      activeSession = await handleStartNewChat();
      if (!activeSession?.conversation_id) return;
    } else if (closed) {
      activeSession = await reopenClosedChat(activeSession);
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

  // 图片压缩（仅图片；失败回退原文件），对齐 herodash guest compressorjs
  const compressImage = (file) =>
    new Promise((resolve) => {
      try {
        // eslint-disable-next-line no-new
        new Compressor(file, {
          quality: 0.6,
          convertSize: 1000000,
          success: (result) => resolve(result),
          error: () => resolve(file),
        });
      } catch (err) {
        resolve(file);
      }
    });

  const sendMediaMessage = async (media) => {
    let activeSession = session;
    if (!activeSession?.conversation_id) {
      activeSession = await handleStartNewChat();
      if (!activeSession?.conversation_id) return;
    } else if (closed) {
      activeSession = await reopenClosedChat(activeSession);
      if (!activeSession?.conversation_id) return;
    }
    const clientMsgId = uuid();
    const optimistic = {
      client_msg_id: clientMsgId,
      sender_type: "visitor",
      body: "",
      msg_type: media.type === "image" ? "image" : "file",
      media_url: media.url,
      media_name: media.name,
      media_type: media.type,
      media_size: media.size,
      isInflight: true,
    };
    setMessages((prev) => upsertMessage(prev, optimistic));
    try {
      const res = await sendChatMessage({
        conversation_id: activeSession.conversation_id,
        visitor_key: visitorKeyRef.current,
        client_msg_id: clientMsgId,
        media_url: media.url,
        media_name: media.name,
        media_type: media.type,
        media_size: media.size,
      });
      if (res?.code === 0) {
        setMessages((prev) =>
          upsertMessage(prev, { ...res.data, client_msg_id: clientMsgId })
        );
        if (res.data?.id) {
          lastIdRef.current = Math.max(lastIdRef.current, Number(res.data.id));
        }
      } else {
        setMessages((prev) => prev.filter((m) => m.client_msg_id !== clientMsgId));
      }
    } catch (err) {
      setMessages((prev) => prev.filter((m) => m.client_msg_id !== clientMsgId));
      console.warn("[LiveChat] send media failed", err);
    }
  };

  // Phase 2 订单分享：发送一条 msg_type=order 消息，携带订单引用 + 最小快照。
  // 越权由后端双校验（订单.user_id == 会话.user_id），前端仅乐观渲染。
  const sendOrderMessage = async (picked) => {
    if (!picked?.order_id) return;
    let activeSession = session;
    if (!activeSession?.conversation_id) {
      activeSession = await handleStartNewChat();
      if (!activeSession?.conversation_id) return;
    } else if (closed) {
      activeSession = await reopenClosedChat(activeSession);
      if (!activeSession?.conversation_id) return;
    }
    const snapshotStr = JSON.stringify(picked.snapshot || {});
    const clientMsgId = uuid();
    const optimistic = {
      client_msg_id: clientMsgId,
      sender_type: "visitor",
      body: "",
      msg_type: "order",
      order_id: picked.order_id,
      order_no: picked.order_no,
      order_snapshot: snapshotStr,
      isInflight: true,
    };
    setMessages((prev) => upsertMessage(prev, optimistic));
    setSendError("");
    try {
      const res = await sendChatMessage({
        conversation_id: activeSession.conversation_id,
        visitor_key: visitorKeyRef.current,
        client_msg_id: clientMsgId,
        order_id: picked.order_id,
        order_no: picked.order_no,
        order_snapshot: snapshotStr,
      });
      if (res?.code === 0) {
        setMessages((prev) =>
          upsertMessage(prev, { ...res.data, client_msg_id: clientMsgId })
        );
        if (res.data?.id) {
          lastIdRef.current = Math.max(lastIdRef.current, Number(res.data.id));
        }
      } else {
        setMessages((prev) => prev.filter((m) => m.client_msg_id !== clientMsgId));
        setSendError(copy.sendOrderFailed || "Could not share this order.");
      }
    } catch (err) {
      setMessages((prev) => prev.filter((m) => m.client_msg_id !== clientMsgId));
      setSendError(copy.sendOrderFailed || "Could not share this order.");
      console.warn("[LiveChat] send order failed", err);
    }
  };

  const handlePickOrder = async (picked) => {
    setOrderPickerOpen(false);
    await sendOrderMessage(picked);
  };

  const handleOpenOrderPicker = () => {
    if (!isLoggedIn) return;
    setOrderPickerOpen(true);
  };

  // 商品分享：发送一条 msg_type=product 消息，携带商品最小快照（标题/首图/价格/详情页链接）。
  // 商品为公开信息，后端不做归属校验；前端仅乐观渲染，关闭态自动开新会话续聊（对标订单分享）。
  const sendProductMessage = async (picked) => {
    if (!picked?.productKey) return;
    let activeSession = session;
    if (!activeSession?.conversation_id) {
      activeSession = await handleStartNewChat();
      if (!activeSession?.conversation_id) return;
    } else if (closed) {
      activeSession = await reopenClosedChat(activeSession);
      if (!activeSession?.conversation_id) return;
    }
    const snapshot = {
      product_key: picked.productKey,
      sort_key: picked.sortKey,
      title: picked.title,
      image: picked.image,
      symbol: picked.symbol,
      price: picked.price === undefined ? "" : String(picked.price),
      href: picked.href,
    };
    const snapshotStr = JSON.stringify(snapshot);
    const clientMsgId = uuid();
    const optimistic = {
      client_msg_id: clientMsgId,
      sender_type: "visitor",
      body: "",
      msg_type: "product",
      product_snapshot: snapshotStr,
      isInflight: true,
    };
    setMessages((prev) => upsertMessage(prev, optimistic));
    try {
      const res = await sendChatMessage({
        conversation_id: activeSession.conversation_id,
        visitor_key: visitorKeyRef.current,
        client_msg_id: clientMsgId,
        product_snapshot: snapshotStr,
      });
      if (res?.code === 0) {
        setMessages((prev) =>
          upsertMessage(prev, { ...res.data, client_msg_id: clientMsgId })
        );
        if (res.data?.id) {
          lastIdRef.current = Math.max(lastIdRef.current, Number(res.data.id));
        }
      } else {
        setMessages((prev) => prev.filter((m) => m.client_msg_id !== clientMsgId));
      }
    } catch (err) {
      setMessages((prev) => prev.filter((m) => m.client_msg_id !== clientMsgId));
      console.warn("[LiveChat] send product failed", err);
    }
  };

  const handlePickProduct = async (picked) => {
    setProductPickerOpen(false);
    await sendProductMessage(picked);
  };

  const handlePickFile = () => {
    // 关闭态也允许选文件：sendMediaMessage 会自动开新会话续聊（对标 herodash）
    if (uploading) return;
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // 允许重复选同一文件
    if (!file) return;
    if (file.size > UPLOAD_MAX_SIZE) return;
    setUploading(true);
    try {
      const isImage = IMAGE_EXT_RE.test(file.name);
      const blob = isImage ? await compressImage(file) : file;
      const toUpload =
        blob instanceof File
          ? blob
          : new File([blob], file.name, { type: blob.type || file.type });
      const res = await uploadChatFile(toUpload);
      if (res?.code !== 0 || !res.data?.url) return;
      await sendMediaMessage(res.data);
    } catch (err) {
      console.warn("[LiveChat] upload failed", err);
    } finally {
      setUploading(false);
    }
  };

  // 订单分享卡片：解析 order_snapshot（JSON 文本），解析失败兜底为订单号文本，勿崩会话流
  const renderOrderCard = (msg) => {
    let snap = {};
    try {
      snap =
        typeof msg.order_snapshot === "string"
          ? JSON.parse(msg.order_snapshot || "{}")
          : msg.order_snapshot || {};
    } catch (err) {
      snap = {};
    }
    const orderNo = snap.order_no || msg.order_no || "";
    const currency = snap.currency || "";
    const total = snap.total_price;
    const statusText = getOrderStatusText(copy, snap.order_status);
    return (
      <div className={styles.orderCard}>
        <div className={styles.orderCardTop}>
          {snap.image ? (
            <img
              className={styles.orderCardThumb}
              src={snap.image}
              alt={snap.title || ""}
            />
          ) : (
            <span className={styles.orderCardThumb} />
          )}
          <div className={styles.orderCardInfo}>
            <div className={styles.orderCardNo}>{orderNo}</div>
            {snap.title ? (
              <div className={styles.orderCardName}>{snap.title}</div>
            ) : null}
            {statusText ? (
              <div className={styles.orderCardStatus}>{statusText}</div>
            ) : null}
          </div>
        </div>
        {total !== undefined && total !== "" ? (
          <div className={styles.orderCardTotal}>
            {snap.pay_symbol || currency} {total}
          </div>
        ) : null}
      </div>
    );
  };

  // 商品分享卡片：解析 product_snapshot（JSON 文本），解析失败兜底空对象，勿崩会话流。
  // 「View product」用 Link 软导航：同页不 remount Layout/LiveChat，面板保持打开。
  // snapshot.href 为站内相对路径（如 /en/product/...）。
  const renderProductCard = (msg) => {
    let snap = {};
    try {
      snap =
        typeof msg.product_snapshot === "string"
          ? JSON.parse(msg.product_snapshot || "{}")
          : msg.product_snapshot || {};
    } catch (err) {
      snap = {};
    }
    const hasPrice = snap.price !== undefined && snap.price !== "";
    return (
      <div className={styles.productCard}>
        <div className={styles.productCardTop}>
          {snap.image ? (
            <img
              className={styles.productCardThumb}
              src={snap.image}
              alt={snap.title || ""}
            />
          ) : (
            <span className={styles.productCardThumb} />
          )}
          <div className={styles.productCardInfo}>
            {snap.title ? (
              <div className={styles.productCardName}>{snap.title}</div>
            ) : null}
            {hasPrice ? (
              <div className={styles.productCardPrice}>
                {snap.symbol}
                {snap.price}
              </div>
            ) : null}
          </div>
        </div>
        {snap.href ? (
          <Link
            className={styles.productCardBtn}
            href={snap.href}
            prefetch={false}
            onClick={(e) => e.stopPropagation()}
          >
            {copy.viewProduct || "View product"}
          </Link>
        ) : null}
      </div>
    );
  };

  // 消息气泡内容：订单卡片 > 商品卡片 > 媒体消息（图片/文件）> 文本
  const renderBubbleContent = (msg) => {
    if (msg.msg_type === "order") {
      return renderOrderCard(msg);
    }
    if (msg.msg_type === "product") {
      return renderProductCard(msg);
    }
    if (msg.media_url) {
      if (msg.media_type === "image") {
        return (
          <a
            className={styles.mediaImageLink}
            href={msg.media_url}
            target="_blank"
            rel="noreferrer"
          >
            <img
              className={styles.mediaImage}
              src={msg.media_url}
              alt={msg.media_name || ""}
            />
          </a>
        );
      }
      return (
        <a
          className={styles.mediaFile}
          href={msg.media_url}
          target="_blank"
          rel="noreferrer"
          download
        >
          <span className={styles.mediaFileIcon}>
            <FileIcon />
          </span>
          <span className={styles.mediaFileName}>{msg.media_name || "file"}</span>
        </a>
      );
    }
    return msg.body;
  };

  // 离线留言：直接提交到 /chat/offline-message（客服稍后邮件回复），提交成功展示成功页
  const handleOfflineSubmit = async () => {
    const email = offline.email.trim();
    const content = offline.content.trim();
    if (!isValidEmail(email) || !content) return;
    if (offlineSubmitting) return;
    setOfflineSubmitting(true);
    try {
      const res = await sendOfflineMessage({
        visitor_key: getVisitorKey(),
        visitor_name: leadRef.current?.name || undefined,
        email,
        phone: offline.phone.trim(),
        content,
        locale: locale || "en",
        area: area || Cookies.get("area") || "us",
        page_url: typeof window !== "undefined" ? window.location.href : "",
      });
      if (res?.code === 0) {
        setOffline((s) => ({ ...s, content: "" }));
        setOfflineSent(true);
      }
    } catch (err) {
      console.warn("[LiveChat] offline submit failed", err);
    } finally {
      setOfflineSubmitting(false);
    }
  };

  // 切片3：拉取会话评价状态（打开已关闭会话时调用），已评价则进入已评价态
  const loadEvaluation = React.useCallback(async (conversationId) => {
    if (!conversationId) return;
    if (!visitorKeyRef.current) {
      visitorKeyRef.current = getVisitorKey();
    }
    try {
      const res = await getChatEvaluation({
        conversation_id: conversationId,
        visitor_key: visitorKeyRef.current,
      });
      if (res?.code === 0 && res.data?.rated) {
        setEvaluation({
          rated: true,
          rating: Number(res.data.rating) || 0,
          feedback: res.data.feedback || "",
        });
      } else {
        setEvaluation({ rated: false, rating: 0, feedback: "" });
      }
    } catch (err) {
      // 接口未就绪/失败时静默，评价区按未评价处理（不展示已评价态）
    }
  }, []);

  // 切片3：在 chat 视图查看已关闭会话时，查询评价状态决定显示评价表单还是已评价态
  React.useEffect(() => {
    const convId = session?.conversation_id || getStoredConversationId();
    if (open && view === "chat" && closed && convId) {
      loadEvaluation(convId);
    }
  }, [open, view, closed, session?.conversation_id, loadEvaluation]);

  // 切片3：提交满意度评价
  const handleSubmitRating = async () => {
    if (!ratingSelected || ratingSubmitting) return;
    const conversationId =
      session?.conversation_id || getStoredConversationId();
    if (!conversationId) return;
    if (!visitorKeyRef.current) {
      visitorKeyRef.current = getVisitorKey();
    }
    const feedback = ratingFeedback.trim();
    setRatingSubmitting(true);
    try {
      const res = await evaluateChat({
        conversation_id: conversationId,
        visitor_key: visitorKeyRef.current,
        rating: ratingSelected,
        feedback,
      });
      if (res?.code === 0) {
        setEvaluation({ rated: true, rating: ratingSelected, feedback });
      }
    } catch (err) {
      console.warn("[LiveChat] submit rating failed", err);
    } finally {
      setRatingSubmitting(false);
    }
  };

  const finishClosePanel = React.useCallback(() => {
    if (closePanelTimerRef.current) {
      clearTimeout(closePanelTimerRef.current);
      closePanelTimerRef.current = null;
    }
    disconnectWs(true);
    setOpen(false);
    setPanelClosing(false);
    setView("faq");
    setExpandedFaqId(null);
  }, [disconnectWs]);

  const closePanel = React.useCallback(() => {
    if (panelClosing) return;

    const isMobile =
      typeof window !== "undefined" &&
      window.matchMedia("(max-width: 779px)").matches;

    if (!isMobile || !open) {
      finishClosePanel();
      return;
    }

    setPanelClosing(true);
    closePanelTimerRef.current = setTimeout(() => {
      closePanelTimerRef.current = null;
      finishClosePanel();
    }, MOBILE_PANEL_CLOSE_MS);
  }, [finishClosePanel, open, panelClosing]);

  const goBackToFaq = () => {
    disconnectWs(true);
    setView("faq");
    setExpandedFaqId(null);
    setOfflineSent(false);
  };

  const openPanel = () => {
    if (closePanelTimerRef.current) {
      clearTimeout(closePanelTimerRef.current);
      closePanelTimerRef.current = null;
    }
    setPanelClosing(false);
    setOpen(true);
    setExpandedFaqId(null);
    // 已有 config（state 或模块缓存）时跳过网络，避免 idle 后 stale connection Stalled
    const cachedCfg = config || peekChatConfig();
    if (cachedCfg) {
      if (!config) setConfig(cachedCfg);
    } else {
      loadConfig();
    }
    // 进入过客服（有历史会话）则直接进聊天页看历史，否则展示 FAQ
    const convId = session?.conversation_id || getStoredConversationId();
    if (convId) {
      if (session?.conversation_id && messages.length > 0) {
        setView("chat");
        setUnread(0);
        lastReadIdRef.current = lastIdRef.current;
        setStoredLastReadId(lastReadIdRef.current);
        reconnectBlockedRef.current = false;
        ensureWsConnected(session);
      } else {
        resumeChat(convId);
      }
      return;
    }
    setView("faq");
  };
  openPanelRef.current = openPanel;

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
        {renderAvatar(styles.headerAvatar)}
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
        headerTitle,
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

  const renderLeadView = () => (
    <>
      {renderHeader(
        headerTitle,
        isWorkTime ? copy.panelStatusOnline : copy.panelStatusOffline,
        isWorkTime,
        true
      )}
      <div className={styles.body}>
        <div className={styles.offlineScroll}>
          <p className={styles.offlineIntro}>{copy.leadIntro}</p>
          <div className={styles.offlineForm}>
            <div className={styles.formField}>
              <label className={styles.formLabel} htmlFor="chat-lead-name">
                {copy.name}
              </label>
              <input
                id="chat-lead-name"
                className={styles.formInput}
                placeholder={copy.namePlaceholder}
                value={leadForm.name}
                onChange={(e) => {
                  const value = e.target.value;
                  setLeadForm((s) => ({ ...s, name: value }));
                  if (leadError.name) {
                    setLeadError((s) => ({ ...s, name: "" }));
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleLeadSubmit();
                  }
                }}
              />
              {leadError.name ? (
                <span className={styles.formError}>{leadError.name}</span>
              ) : null}
            </div>
            <div className={styles.formField}>
              <label className={styles.formLabel} htmlFor="chat-lead-email">
                {copy.email}
              </label>
              <input
                id="chat-lead-email"
                type="email"
                className={styles.formInput}
                placeholder="you@example.com"
                value={leadForm.email}
                onChange={(e) => {
                  const value = e.target.value;
                  setLeadForm((s) => ({ ...s, email: value }));
                  if (leadError.email) {
                    setLeadError((s) => ({ ...s, email: "" }));
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleLeadSubmit();
                  }
                }}
              />
              {leadError.email ? (
                <span className={styles.formError}>{leadError.email}</span>
              ) : null}
            </div>
          </div>
        </div>
        <button
          type="button"
          className={styles.submitBtn}
          disabled={loading}
          onClick={handleLeadSubmit}
        >
          {copy.continueBtn}
        </button>
      </div>
    </>
  );

  const renderOfflineView = () => (
    <>
      {renderHeader(
        headerTitle,
        offlineSent ? copy.offlineSuccessTitle : copy.panelStatusOffline,
        false,
        true
      )}
      <div className={styles.body}>
        {offlineSent ? (
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
              disabled={
                offlineSubmitting ||
                !isValidEmail(offline.email) ||
                !offline.content.trim()
              }
              onClick={handleOfflineSubmit}
            >
              {copy.submit}
            </button>
          </>
        )}
      </div>
    </>
  );

  // 切片3：满意度评价——内联锚定在结束系统消息之后，随会话历史留存。
  // 已评价态恒展示（历史留痕，续聊后仍在线程里）；未评价表单仅当会话当前处于结束态(closed)时可填。
  const renderEndedRating = () => {
    if (evaluation.rated) {
      return (
        <div className={styles.endedInline}>
          <div className={styles.rateBox}>
            <div className={styles.rateThanks}>{copy.rateThanks}</div>
            <div className={styles.rateEmojiRow}>
              {RATING_EMOJIS.map((emoji, idx) => {
                const value = idx + 1;
                const active = evaluation.rating === value;
                return (
                  <span
                    key={value}
                    className={`${styles.rateEmoji} ${
                      active ? styles.rateEmojiActive : styles.rateEmojiDim
                    }`}
                    aria-hidden="true"
                  >
                    {emoji}
                  </span>
                );
              })}
            </div>
            {evaluation.feedback ? (
              <div className={styles.rateFeedbackText}>
                {evaluation.feedback}
              </div>
            ) : null}
          </div>
        </div>
      );
    }
    if (!closed) return null;
    return (
      <div className={styles.endedInline}>
        <div className={styles.rateBox}>
          <div className={styles.rateTitle}>{copy.rateTitle}</div>
          <div className={styles.rateSubtitle}>{copy.rateSubtitle}</div>
          <div className={styles.rateEmojiRow}>
            {RATING_EMOJIS.map((emoji, idx) => {
              const value = idx + 1;
              const active = ratingSelected === value;
              const label =
                (copy.ratingLabels && copy.ratingLabels[idx]) || "";
              return (
                <button
                  key={value}
                  type="button"
                  className={`${styles.rateEmojiBtn} ${
                    active ? styles.rateEmojiBtnActive : ""
                  }`}
                  aria-label={label}
                  title={label}
                  aria-pressed={active}
                  onClick={() => setRatingSelected(value)}
                >
                  {emoji}
                </button>
              );
            })}
          </div>
          {ratingSelected ? (
            <div className={styles.rateSelectedLabel}>
              {(copy.ratingLabels && copy.ratingLabels[ratingSelected - 1]) ||
                ""}
            </div>
          ) : null}
          <textarea
            className={styles.rateFeedback}
            rows={2}
            placeholder={copy.feedbackPlaceholder}
            value={ratingFeedback}
            onChange={(e) => setRatingFeedback(e.target.value)}
          />
          <button
            type="button"
            className={styles.transferBtn}
            disabled={!ratingSelected || ratingSubmitting}
            onClick={handleSubmitRating}
          >
            {copy.rateSubmit}
          </button>
        </div>
      </div>
    );
  };

  const renderChatView = () => (
    <>
      {renderHeader(
        chatTitle,
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
          {messages.map((msg, idx) => {
            const isVisitor = msg.sender_type === "visitor";
            const isSystem =
              msg.msg_type === "system" || msg.body === CHAT_END_BODY;
            if (isSystem) {
              return (
                <React.Fragment key={msg.id || msg.client_msg_id}>
                  <div className={`${styles.msgRow} ${styles.msgRowAgent}`}>
                    <div className={`${styles.bubble} ${styles.bubbleSystem}`}>
                      <div className={styles.systemLine}>
                        {msg.body === CHAT_END_BODY ? copy.chatEnded : msg.body}
                      </div>
                    </div>
                  </div>
                  {idx === lastEndIdx ? renderEndedRating() : null}
                </React.Fragment>
              );
            }
            // 切片4：坐席真实姓名（sender_type==="agent" 且有 sender_name）
            const agentName =
              msg.sender_type === "agent" ? msg.sender_name || "" : "";
            return (
              <div
                key={msg.id || msg.client_msg_id}
                className={`${styles.msgRow} ${
                  isVisitor ? styles.msgRowVisitor : styles.msgRowAgent
                }`}
              >
                {!isVisitor ? renderAvatar(styles.agentAvatar, agentName) : null}
                <div className={styles.bubbleCol}>
                  {agentName ? (
                    <div className={styles.agentName}>{agentName}</div>
                  ) : null}
                  <div
                    className={`${styles.bubble} ${
                      isVisitor ? styles.bubbleVisitor : styles.bubbleAgent
                    } ${msg.media_url ? styles.bubbleMedia : ""}`}
                  >
                    {renderBubbleContent(msg)}
                    {msg.created_time && !msg.isInflight ? (
                      <div className={styles.time}>
                        {formatMsgTime(msg.created_time)}
                      </div>
                    ) : msg.isInflight ? (
                      <div className={styles.time}>&nbsp;</div>
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })}
          {agentTyping && !closed ? (
            <div className={`${styles.msgRow} ${styles.msgRowAgent}`}>
              {renderAvatar(styles.agentAvatar)}
              <div className={styles.bubbleCol}>
                <div className={`${styles.bubble} ${styles.bubbleAgent}`}>
                  <span className={styles.loadingDots} aria-label={copy.typing}>
                    <span />
                    <span />
                    <span />
                  </span>
                </div>
              </div>
            </div>
          ) : null}
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
          {sendError ? (
            <div className={styles.sendError} role="alert">
              {sendError}
            </div>
          ) : null}
          <div className={styles.inputWrap}>
            <input
              ref={fileInputRef}
              type="file"
              accept={UPLOAD_ACCEPT}
              style={{ display: "none" }}
              onChange={handleFileChange}
            />
            <button
              type="button"
              className={styles.attachBtn}
              aria-label="Attach file"
              disabled={uploading}
              onClick={handlePickFile}
            >
              <AttachIcon />
            </button>
            {isLoggedIn ? (
              <button
                type="button"
                className={styles.attachBtn}
                aria-label={copy.shareOrder}
                title={copy.shareOrder}
                onClick={handleOpenOrderPicker}
              >
                <OrderIcon />
              </button>
            ) : null}
            <button
              type="button"
              className={styles.attachBtn}
              aria-label={copy.shareProduct}
              title={copy.shareProduct}
              onClick={() => setProductPickerOpen(true)}
            >
              <ProductIcon />
            </button>
            <div className={styles.inputBox}>
              <input
                className={styles.input}
                value={input}
                placeholder={copy.typePlaceholder}
                onChange={(e) => {
                  setInput(e.target.value);
                  sendTypingSignal();
                }}
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
        </div>
      </div>
    </>
  );

  if (config && config.enabled === false) return null;

  return (
    <div
      className={`${styles.wrapper} ${bubbleLeft ? styles.wrapperLeft : ""}`}
      style={wrapperStyle}
    >
      {open && (
        <>
          <button
            type="button"
            className={`${styles.overlay} ${panelClosing ? styles.overlayClosing : ""}`}
            aria-label="Close live chat"
            onClick={closePanel}
          />
          <div
            className={`${styles.panel} ${panelClosing ? styles.panelClosing : ""} ${bubbleLeft ? styles.panelLeft : ""}`}
            role="dialog"
            aria-label="Live chat"
          >
            {view === "faq" ? renderFaqView() : null}
            {view === "lead" ? renderLeadView() : null}
            {view === "offline" ? renderOfflineView() : null}
            {view === "chat" ? renderChatView() : null}
            {orderPickerOpen ? (
              <OrderPicker
                copy={copy}
                onPick={handlePickOrder}
                onClose={() => setOrderPickerOpen(false)}
              />
            ) : null}
            {productPickerOpen ? (
              <ProductPicker
                copy={copy}
                locale={locale}
                area={area}
                onPick={handlePickProduct}
                onClose={() => setProductPickerOpen(false)}
              />
            ) : null}
          </div>
        </>
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
        {!open && unread > 0 ? (
          <span className={styles.unreadBadge} aria-label={`${unread} unread messages`}>
            {unread > 99 ? "99+" : unread}
          </span>
        ) : null}
      </button>
    </div>
  );
}

export { openLiveChat };
