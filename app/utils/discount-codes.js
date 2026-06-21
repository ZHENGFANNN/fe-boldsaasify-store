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

const discountCodesStorage = {
  DISCOUNT_CODES_STORAGE_KEY,
  readStoredDiscountCodes,
  writeStoredDiscountCodes,
};

export default discountCodesStorage;
