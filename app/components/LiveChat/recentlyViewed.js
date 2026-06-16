"use client";

// 最近浏览商品（纯客户端，localStorage）。商品详情页加载时写入，客服聊天窗「分享商品」选择器读取。
// 与购物车/搜索来源统一的展示结构：{ productKey, sortKey, title, image, symbol, price, href }
const RECENT_KEY = "boldradiant_recently_viewed";
const RECENT_MAX = 10;

export function getRecentlyViewed() {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    const list = JSON.parse(raw || "[]");
    return Array.isArray(list) ? list.filter((it) => it && it.productKey) : [];
  } catch (err) {
    return [];
  }
}

// 记录一次浏览：按 productKey 去重并置顶，限 RECENT_MAX 条
export function recordRecentlyViewed(item) {
  if (typeof window === "undefined" || !item?.productKey) return;
  try {
    const next = [
      item,
      ...getRecentlyViewed().filter((it) => it.productKey !== item.productKey),
    ].slice(0, RECENT_MAX);
    localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch (err) {
    // ignore quota / serialize errors
  }
}
