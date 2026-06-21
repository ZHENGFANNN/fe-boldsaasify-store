/** @format */

import api from "@/request";

/**
 * 自动折扣（限时促销）批量查询。
 *
 * 调后端接口 A：POST /pay/getProductDiscounts
 *   入参 { area_code, product_list:[{product_key, sort_key}] }
 *   出参 data:{ discounts:[{product_key, value_type, value, ends_at, title}] }
 *        ends_at 为毫秒时间戳。
 *
 * 内存缓存：按 area_code + 排序后的 product_key 列表作为缓存槽（参考同目录
 * get-products-pricing 的缓存思路）。同一地区同一批商品的二次查询直接命中缓存，
 * 不再回源后端。缓存带 TTL（默认 60s），避免促销过期/上新后长期读到旧折扣。
 *
 * @returns {Promise<{ discounts: Array, map: Object }>}
 *   discounts：原始数组；map：按 product_key 建索引，便于命中查询。
 */
const CACHE_TTL_MS = 60 * 1000;
const cache = new Map();

function buildCacheKey(areaCode, productList) {
  const keys = (productList || [])
    .map((p) => `${p.sort_key || ""}:${p.product_key || ""}`)
    .filter((s) => s.indexOf(":") > 0)
    .sort()
    .join(",");
  return `${areaCode || "us"}|${keys}`;
}

function toResult(discounts) {
  const list = Array.isArray(discounts) ? discounts : [];
  const map = {};
  list.forEach((d) => {
    if (d && d.product_key) map[d.product_key] = d;
  });
  return { discounts: list, map };
}

export async function getProductDiscounts({ area_code, product_list }) {
  const list = Array.isArray(product_list) ? product_list : [];
  if (!list.length) return { discounts: [], map: {} };

  const cacheKey = buildCacheKey(area_code, list);
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
    return cached.result;
  }

  try {
    const res = await api.post("/pay/getProductDiscounts", {
      area_code: area_code || "us",
      product_list: list.map((p) => ({
        product_key: p.product_key,
        sort_key: p.sort_key,
      })),
    });
    if (res?.code !== 0) {
      return { discounts: [], map: {} };
    }
    const result = toResult(res.data?.discounts);
    cache.set(cacheKey, { ts: Date.now(), result });
    return result;
  } catch (err) {
    console.error("getProductDiscounts 失败:", err?.message);
    return { discounts: [], map: {} };
  }
}

export default getProductDiscounts;
