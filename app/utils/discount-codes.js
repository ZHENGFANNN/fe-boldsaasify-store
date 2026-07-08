/** @format */

/**
 * 购物车/结算/详情页共享的「已应用折扣码」读写工具。
 *
 * 单一来源：localStorage key `store_shopping_discount_codes`，存字符串数组。
 * - 购物车 Drawer（CartModal）、结算页（order/Main）、详情页折扣码入口、
 *   WelcomePopup 订阅成功自动应用，全部读写同一 key，体验闭环。
 * - 读取做防御：非数组 / 解析失败 / SSR 一律返回 []，只保留字符串项。
 */
export const DISCOUNT_CODES_STORAGE_KEY = "store_shopping_discount_codes";

export function readStoredDiscountCodes() {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(DISCOUNT_CODES_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter((x) => typeof x === "string")
      : [];
  } catch {
    return [];
  }
}

export function writeStoredDiscountCodes(codes) {
  if (typeof window === "undefined") return;
  try {
    const safe = Array.isArray(codes)
      ? codes.filter((x) => typeof x === "string")
      : [];
    window.localStorage.setItem(
      DISCOUNT_CODES_STORAGE_KEY,
      JSON.stringify(safe)
    );
  } catch {}
}

/**
 * 折扣码拒绝原因错误码（对齐后端 be-order-service constant/discount_error.go）。
 * previewOrder 现返回 rejected_codes:[{code, reason, message}]，reason 为下列之一。
 */
export const DISCOUNT_REJECT_REASON = {
  INVALID: 10107, // 无效（不存在/拼错/非 code 方式）
  EXPIRED: 10108, // 已过期或未生效
  NOT_APPLICABLE: 10109, // 不适用于购物车内商品
  NOT_COMBINABLE: 10110, // 与其他折扣冲突不可叠加
  UNSUPPORTED: 10112, // 暂不支持的折扣类型
  USAGE_LIMIT: 10113, // 全局总用量已达上限（max_uses_total）
  PER_USER_LIMIT: 10114, // 当前用户已达使用上限（per_user_limit）
};

/**
 * 把 rejected_code 转成面向用户的提示文案。
 * 优先用 i18n（LANG）按 reason 取对应 key，缺失时回退英文；
 * 再不行用后端返回的 message（中文默认），最后兜底通用文案。
 * @param {{code:string, reason:number, message?:string}} rejected
 * @param {Record<string,string>} LANG
 */
export function formatRejectedCodeMessage(rejected, LANG = {}) {
  const code = rejected?.code || "";
  const reason = Number(rejected?.reason);
  const keyByReason = {
    [DISCOUNT_REJECT_REASON.INVALID]: "store.order.discount_reject_invalid",
    [DISCOUNT_REJECT_REASON.EXPIRED]: "store.order.discount_reject_expired",
    [DISCOUNT_REJECT_REASON.NOT_APPLICABLE]:
      "store.order.discount_reject_not_applicable",
    [DISCOUNT_REJECT_REASON.NOT_COMBINABLE]:
      "store.order.discount_reject_not_combinable",
    [DISCOUNT_REJECT_REASON.UNSUPPORTED]:
      "store.order.discount_reject_unsupported",
    [DISCOUNT_REJECT_REASON.USAGE_LIMIT]:
      "store.order.discount_reject_usage_limit",
    [DISCOUNT_REJECT_REASON.PER_USER_LIMIT]:
      "store.order.discount_reject_per_user_limit",
  };
  const fallbackByReason = {
    [DISCOUNT_REJECT_REASON.INVALID]: '"${code}" is not a valid code',
    [DISCOUNT_REJECT_REASON.EXPIRED]: '"${code}" has expired',
    [DISCOUNT_REJECT_REASON.NOT_APPLICABLE]:
      '"${code}" doesn\'t apply to items in your cart',
    [DISCOUNT_REJECT_REASON.NOT_COMBINABLE]:
      '"${code}" can\'t be combined with other discounts',
    [DISCOUNT_REJECT_REASON.UNSUPPORTED]: '"${code}" isn\'t supported here',
    [DISCOUNT_REJECT_REASON.USAGE_LIMIT]:
      '"${code}" has reached its usage limit',
    [DISCOUNT_REJECT_REASON.PER_USER_LIMIT]:
      '"${code}" has reached its usage limit for your account',
  };
  const tpl =
    (LANG && LANG[keyByReason[reason]]) ||
    fallbackByReason[reason] ||
    rejected?.message ||
    '"${code}" could not be applied';
  return tpl.replace("${code}", code);
}


const discountCodesStorage = {
  DISCOUNT_CODES_STORAGE_KEY,
  DISCOUNT_REJECT_REASON,
  readStoredDiscountCodes,
  writeStoredDiscountCodes,
  formatRejectedCodeMessage,
};

export default discountCodesStorage;
