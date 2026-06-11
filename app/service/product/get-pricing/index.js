/** @format */

import instance from "@/request";

/**
 * 客户端按 area 拉取商品地区定价（用于非默认地区的首屏价格补差）。
 * 返回 { combos, associateProducts } 或 null（失败时由调用方退回 us 价）。
 */
export async function getProductPricing({ sortKey, productKey, area, locale }) {
  if (!sortKey || !productKey || !area) return null;
  try {
    const res = await instance.get("/config/getProductPricing", {
      params: { sortKey, productKey, area, language: locale },
    });
    if (res?.code !== 0) return null;
    return res.data ?? null;
  } catch (err) {
    console.error("client getProductPricing 失败:", err?.message);
    return null;
  }
}

export default getProductPricing;
