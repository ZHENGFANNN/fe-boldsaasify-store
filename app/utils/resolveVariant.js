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

/**
 * 判断「在已选其它轴的前提下，某轴的某个候选值」命中的变体是否至少有一个有库存。
 * 与 isValueAvailable 同样的匹配口径，只是额外看命中变体对应 combo 的库存标记。
 * 用于「可选中但缺货」的虚框提示（缺货不禁用，仅视觉标记）。
 * @param {Record<string, boolean>} stockByCombo - { combo_key: 是否有库存 }
 * @returns {boolean} 命中变体中存在有库存者返回 true；全部缺货返回 false。
 */
export function isValueInStock(
  variants,
  selection,
  axisCode,
  valueCode,
  axes,
  stockByCombo
) {
  if (!Array.isArray(variants)) return false;
  const axisCodes = (axes || []).map((a) => a.axis_code);
  return variants.some((v) => {
    const map = v.option_value_map || {};
    if (map[axisCode] !== valueCode) return false;
    // 其它已选轴需与该变体一致（未选的轴不约束），与 isValueAvailable 一致
    const matched = axisCodes.every((c) => {
      if (c === axisCode) return true;
      const sel = selection?.[c];
      return !sel || map[c] === sel;
    });
    return matched && !!stockByCombo?.[v.combo_key];
  });
}

/**
 * 反推默认 selection：优先取后端标记的默认变体(is_default)，否则降级首个变体。
 * 后端(user-service)已按 is_default DESC 排序，variants[0] 通常即默认；
 * 这里再显式 find 一次，避免将来变体顺序变化导致默认项漂移。
 */
export function defaultSelection(variants, axes) {
  const axisCodes = (axes || []).map((a) => a.axis_code);
  if (axisCodes.length === 0 || !Array.isArray(variants) || !variants.length) {
    return {};
  }
  const first = variants.find((v) => v.is_default) || variants[0];
  const map = first.option_value_map || {};
  const sel = {};
  axisCodes.forEach((c) => {
    if (map[c]) sel[c] = map[c];
  });
  return sel;
}
