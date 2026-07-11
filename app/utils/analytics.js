/**
 * 统一埋点上报入口 —— 同时向 GA4、Facebook Pixel、GTM dataLayer 发送事件。
 *
 * 三家消费者的接入位置：
 *   - GA4:      app/components/Head/Analytics/index.js 加载 gtag.js 并初始化 window.gtag
 *   - FB Pixel: 同上，初始化 window.fbq
 *   - dataLayer: 由 GA4 初始化脚本创建 window.dataLayer；即使未来重接 GTM 亦可直接消费
 *
 * 事件名策略：
 *   - Purchase / AddToCart / InitiateCheckout 等已对齐 FB Pixel 标准事件名，直接用
 *   - ViewProduct → ViewContent 别名映射（FB 标准事件，享受 Meta 转化优化）
 *   - 其他自定义事件（IndexBannerItem/ProductGuarantee-Email 等）在 FB 侧走 fbq('trackCustom', ...)
 *
 * XSS/健壮性：
 *   - 客户端存在性 guard（SSR 环境静默跳过）
 *   - gtag/fbq 未加载（埋点未配置或加载失败）时静默跳过，不阻断业务
 *   - 每家上报独立 try/catch，一家失败不影响另一家
 */

// FB Pixel 标准事件白名单，其余走 trackCustom。
// 参考 https://developers.facebook.com/docs/meta-pixel/reference#standard-events
const FB_STANDARD_EVENTS = new Set([
  "PageView",
  "ViewContent",
  "Search",
  "AddToCart",
  "InitiateCheckout",
  "AddPaymentInfo",
  "Purchase",
  "Lead",
  "CompleteRegistration",
  "Contact",
  "CustomizeProduct",
  "Donate",
  "FindLocation",
  "Schedule",
  "StartTrial",
  "SubmitApplication",
  "Subscribe",
]);

// 事件名归一映射：把内部约定名对齐到 FB Pixel 标准事件（GA4 也接受同名）。
const EVENT_ALIAS = {
  ViewProduct: "ViewContent",
};

/** 清理 undefined 字段，避免 gtag/fbq 收到无效 payload */
function pruneParams(params) {
  const out = {};
  if (!params || typeof params !== "object") return out;
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null) out[k] = v;
  }
  return out;
}

/**
 * 上报事件到 GA4 + FB Pixel + dataLayer。
 * @param {string} eventName 事件名（自定义或 FB 标准名）
 * @param {object} [params] 事件参数，snake_case 或 camelCase 均可
 */
export function track(eventName, params) {
  if (typeof window === "undefined" || !eventName) return;

  const name = EVENT_ALIAS[eventName] || eventName;
  const payload = pruneParams(params);

  // 1) GA4
  if (typeof window.gtag === "function") {
    try {
      window.gtag("event", name, payload);
    } catch (e) {
      // 静默
    }
  }

  // 2) FB Pixel（标准事件走 track，自定义走 trackCustom）
  if (typeof window.fbq === "function") {
    try {
      const method = FB_STANDARD_EVENTS.has(name) ? "track" : "trackCustom";
      window.fbq(method, name, payload);
    } catch (e) {
      // 静默
    }
  }

  // 3) GTM dataLayer 兼容层：便于未来重接 GTM 容器或已有 dataLayer 消费者
  if (Array.isArray(window.dataLayer)) {
    try {
      window.dataLayer.push({ event: name, ...payload });
    } catch (e) {
      // 静默
    }
  }
}

/**
 * 页面浏览事件的语义快捷方式；等价于 track('PageView', params)。
 * FB Pixel 在初始化脚本里已发送一次 PageView，此函数用于 SPA 路由切换后再次上报。
 */
export function trackPageView(params) {
  track("PageView", params);
}
