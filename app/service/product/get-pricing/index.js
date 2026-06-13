/** @format */

/**
 * 客户端按 area 拉取商品地区定价（用于非默认地区的首屏价格补差）。
 *
 * 不再 axios 直连后端，改打本站 Next 路由 /api/product-pricing：
 * 该路由对后端做一层转发并按 sortKey/productKey/area 这个 key 用 Next/CDN 缓存，
 * 同一地区同一商品的二次访问直接命中缓存，无需回源 Go，速度更快。
 *
 * 返回 { combos, associateProducts } 或 null（失败时由调用方退回 us 价）。
 */
export async function getProductPricing({ sortKey, productKey, area, locale }) {
  if (!sortKey || !productKey || !area) return null;
  try {
    const qs = new URLSearchParams({
      sortKey,
      productKey,
      area,
      language: locale || "",
    });
    const res = await fetch(`/api/product-pricing?${qs.toString()}`);
    if (!res.ok) return null;
    const json = await res.json().catch(() => null);
    if (json?.code !== 0) return null;
    return json.data ?? null;
  } catch (err) {
    console.error("client getProductPricing 失败:", err?.message);
    return null;
  }
}

export default getProductPricing;
