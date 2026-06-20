/** 将定价接口数据合并进商品对象（注入 comboList / associateProduct 的 areaInfo）。 */
export function applyProductPricing(productInfo, pricing) {
  if (!productInfo || !pricing) return productInfo;

  const comboMap = Object.fromEntries(
    (pricing.combos || []).map((c) => [c.comboKey, c.areaInfo || null])
  );
  const comboList = (productInfo.comboList || []).map((combo) => ({
    ...combo,
    areaInfo: comboMap[combo.key] ?? null
  }));

  const assocMap = Object.fromEntries(
    (pricing.associateProducts || []).map((a) => [
      a.productKey,
      a.areaInfo || null
    ])
  );
  const associateProduct = (productInfo.associateProduct || []).map((item) => ({
    ...item,
    areaInfo: assocMap[item.key] ?? null
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

/**
 * 有效单价口径（全站统一）：商品本身有折扣（selling_price > 0 且 < product_price）
 * 时取折后价 selling_price，否则取原价 product_price。
 * GoodPrice(主区)、CartModal(购物车)、GoodFooter(底部栏) 必须用同一口径，
 * 避免出现「底部栏无条件用 selling_price → 无折扣时显示 0/错价」之类的不一致。
 * @param {object} areaInfo - 含 product_price / selling_price 的地区定价对象
 * @returns {number} 有效单价（取不到时为 0）
 */
export function effectivePrice(areaInfo) {
  const product = Number(areaInfo?.product_price) || 0;
  const selling = Number(areaInfo?.selling_price) || 0;
  const hasDiscount = selling > 0 && selling < product;
  return hasDiscount ? selling : product;
}
