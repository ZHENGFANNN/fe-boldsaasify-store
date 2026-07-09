"use client";

// 解析商品的 360 帧：仅当 productInfo.spin_list 有真实帧图时返回 [{ src }]，否则 null。
// ?spin=demo 占位演示已关闭，待后端接入 spin_list 后再启用 360° tab。

export function useSpinFrames(productInfo) {
  if (
    Array.isArray(productInfo?.spin_list) &&
    productInfo.spin_list.length > 0
  ) {
    return productInfo.spin_list;
  }
  return null;
}
