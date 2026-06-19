/** @format */

// ============================================================
// V2 变体解析：把「用户每轴选中的 value_code」(selection: {axis_code: value_code})
// 与变体列表 variants[].option_value_map 比对，命中（全轴相等）即该变体。
// ============================================================

/**
 * 在 variants 中查找与 selection 完全匹配的变体。
 * selection / option_value_map 均为 { axis_code: value_code }。
 * @returns {object|null} 命中的 variant（含 combo_key），无则 null。
 */
export function resolveVariant(variants, selection, axes) {
  if (!Array.isArray(variants) || variants.length === 0) return null;
  const axisCodes = (axes || []).map((a) => a.axis_code);
  // 每个轴都已选值才尝试解析
  if (axisCodes.length > 0 && axisCodes.some((c) => !selection?.[c])) {
    return null;
  }
  return (
    variants.find((v) => {
      const map = v.option_value_map || {};
      // selection 的每个轴值都要与变体一致
      return axisCodes.every((c) => map[c] === selection[c]);
    }) || null
  );
}

/**
 * 判断「在已选其它轴的前提下，某轴的某个候选值」是否存在可命中的变体——
 * 用于置灰不可用选项（Shopify 式 disabled）。
 * @returns {boolean}
 */
export function isValueAvailable(variants, selection, axisCode, valueCode, axes) {
  if (!Array.isArray(variants)) return false;
  const axisCodes = (axes || []).map((a) => a.axis_code);
  return variants.some((v) => {
    const map = v.option_value_map || {};
    if (map[axisCode] !== valueCode) return false;
    // 其它已选轴需与该变体一致（未选的轴不约束）
    return axisCodes.every((c) => {
      if (c === axisCode) return true;
      const sel = selection?.[c];
      return !sel || map[c] === sel;
    });
  });
}

/** 由首个有库存(或第一个)变体反推默认 selection。 */
export function defaultSelection(variants, axes) {
  const axisCodes = (axes || []).map((a) => a.axis_code);
  if (axisCodes.length === 0 || !Array.isArray(variants) || !variants.length) {
    return {};
  }
  const first = variants[0];
  const map = first.option_value_map || {};
  const sel = {};
  axisCodes.forEach((c) => {
    if (map[c]) sel[c] = map[c];
  });
  return sel;
}
