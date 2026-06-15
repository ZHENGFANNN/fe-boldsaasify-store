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
