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
 * 有效单价口径（全站统一）：直接取原价 product_price。
 * 商品级 selling_price/product_discount 已下线，所有优惠统一由折扣规则在结算链路上处理。
 * GoodPrice(主区)、CartModal(购物车)、GoodFooter(底部栏) 保持同一入口，便于后续换算。
 * @param {object} areaInfo - 含 product_price 的地区定价对象
 * @returns {number} 有效单价（取不到时为 0）
 */
export function effectivePrice(areaInfo) {
  return Number(areaInfo?.product_price) || 0;
}

/**
 * 根据自动折扣规则 + 原价，算出单件折后价（正数、"分"级；无折扣或无价时返回原价）。
 * 供详情页价格区、Footer、Countdown 复用，保证 3 处口径一致。
 * @param {object} areaInfo   - 含 product_price / currency_unit
 * @param {object} autoDiscount - { value_type: "percent"|"fixed", value: number }
 * @returns {number} 折后单价（≥ 0）
 */
export function discountedUnitPrice(areaInfo, autoDiscount) {
  const original = Number(areaInfo?.product_price) || 0;
  if (!original || !autoDiscount) return original;
  const value = Number(autoDiscount.value) || 0;
  if (autoDiscount.value_type === "percent") {
    return Math.max(0, original * (1 - value / 100));
  }
  return Math.max(0, original - value);
}

/**
 * 一件商品可省金额（原价 - 折后价，"分"级；无折扣或无价时返回 0）。
 * 结算前的展示口径，不做地区、税、运费换算。
 * @param {object} areaInfo   - 含 product_price
 * @param {object} autoDiscount - 同 discountedUnitPrice
 * @returns {number} 单件节省（≥ 0）
 */
export function savedUnitAmount(areaInfo, autoDiscount) {
  const original = Number(areaInfo?.product_price) || 0;
  if (!original || !autoDiscount) return 0;
  return Math.max(0, original - discountedUnitPrice(areaInfo, autoDiscount));
}
