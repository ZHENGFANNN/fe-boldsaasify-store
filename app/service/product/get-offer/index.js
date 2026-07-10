/** @format */

/**
 * 客户端按 area 批量取「价格 + 折扣」聚合数据。
 * 打本站 Next 路由 /api/products-offer：服务端已把价(user-service /config)
 * 与自动折扣(order-service /pay)在服务端 join 好，前端一次拿到
 * { combos(原价) + discount(折扣规则) }，无需再发两次请求、手动按 product_key 对齐。
 *
 * 取代旧的 get-pricing / get-products-pricing（价）与 get-product-discounts（折扣）。
 *
 * @param area   地区码（缺省 us）。
 * @param locale 语言（价格文案用；折扣与语言无关）。
 * @param keys   [{sortKey, productKey}]，将转成 `sort1:p1,sort2:p2,...` query（排序后拼接，命中稳定缓存槽）。
 * @returns { area, list:[{sortKey, productKey, combos, associateProducts, discount}] }
 *          或 null（失败，调用方退回骨架/兜底）。折扣 discount 为 null 表示无命中自动折扣。
 */
export async function getProductsOffer({ area, locale, keys }) {
  if (!Array.isArray(keys) || keys.length === 0) {
    return { area: area || "us", list: [] };
  }
  // 与 server 端 getProductsPricing 相同的 keys 排序，命中相同缓存槽。
  const keysParam = keys
    .map((k) => `${k.sortKey}:${k.productKey}`)
    .filter((s) => s && s.indexOf(":") > 0)
    .sort()
    .join(",");
  if (!keysParam) return { area: area || "us", list: [] };

  try {
    const qs = new URLSearchParams({
      area: area || "us",
      language: locale || "",
      keys: keysParam,
    });
    const res = await fetch(`/api/products-offer?${qs.toString()}`);
    if (!res.ok) return null;
    const json = await res.json().catch(() => null);
    if (json?.code !== 0) return null;
    return json.data ?? null;
  } catch (err) {
    console.error("client getProductsOffer 失败:", err?.message);
    return null;
  }
}

export default getProductsOffer;
