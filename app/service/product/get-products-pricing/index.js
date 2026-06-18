/** @format */

/**
 * 客户端按 area 批量取首页/分类页商品定价。
 * 不直连后端，改打本站 Next 路由 /api/products-pricing：
 *   - 该路由对后端做转发并按 area+sorted(keys) 进 Next/CDN 缓存；
 *   - 二次访问命中缓存即秒回，无需回源 Go。
 *
 * @returns { area, list:[{sortKey, productKey, combos, associateProducts}] } 或 null（失败）。
 */
export async function getProductsPricing({ area, locale, keys }) {
  if (!Array.isArray(keys) || keys.length === 0) {
    return { area: area || "us", list: [] };
  }
  // 与 server 端 getProductsPricing 保持相同的 keys 排序，命中相同的缓存槽。
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
    const res = await fetch(`/api/products-pricing?${qs.toString()}`);
    if (!res.ok) return null;
    const json = await res.json().catch(() => null);
    if (json?.code !== 0) return null;
    return json.data ?? null;
  } catch (err) {
    console.error("client getProductsPricing 失败:", err?.message);
    return null;
  }
}

export default getProductsPricing;
