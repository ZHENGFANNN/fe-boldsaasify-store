/** @format */

const HOST = process.env.NEXT_PUBLIC_HOST;

/** 将定价接口数据合并进商品对象（注入 comboList / associateProduct 的 areaInfo）。 */
export function applyProductPricing(productInfo, pricing) {
  if (!productInfo || !pricing) return productInfo;

  const comboMap = Object.fromEntries(
    (pricing.combos || []).map((c) => [c.comboKey, c.areaInfo || null])
  );
  const comboList = (productInfo.comboList || []).map((combo) => ({
    ...combo,
    areaInfo: comboMap[combo.key] ?? null,
  }));

  const assocMap = Object.fromEntries(
    (pricing.associateProducts || []).map((a) => [
      a.productKey,
      a.areaInfo || null,
    ])
  );
  const associateProduct = (productInfo.associateProduct || []).map((item) => ({
    ...item,
    areaInfo: assocMap[item.key] ?? null,
  }));

  return { ...productInfo, comboList, associateProduct };
}

export function pickCombo(comboList, prevKey) {
  const list = Array.isArray(comboList) ? comboList : [];
  if (prevKey) {
    const match = list.find((c) => c.key === prevKey);
    if (match) return match;
  }
  return list.find((item) => item.areaInfo?.stock) || list[0] || {};
}

/** 客户端拉取地区价格（不走 ISR，按 area 实时请求）。 */
export async function fetchProductPricing({
  sortKey,
  productKey,
  area,
  language,
}) {
  if (!HOST) {
    throw new Error("NEXT_PUBLIC_HOST 未配置");
  }
  const url =
    `${HOST}/config/getProductPricing` +
    `?sortKey=${encodeURIComponent(sortKey)}` +
    `&productKey=${encodeURIComponent(productKey)}` +
    `&area=${encodeURIComponent(area || "us")}` +
    `&language=${encodeURIComponent(language || "en")}`;

  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`getProductPricing HTTP ${res.status}`);
  }
  const json = await res.json();
  if (json?.code !== 0) {
    throw new Error("getProductPricing 业务失败");
  }
  return json.data;
}
