/** @format */

// 节日折扣（festival discount）已下线：后端表与 /config/getFestivalDiscount 接口已移除，
// 构建期不再物化 productDiscount/festival/index.json。此处恒返回 null，
// 上游 GOODDISCOUNTFESTIVAL 即为 null，相关 UI 组件已做空值处理（可选链）。
// 保留本函数与签名以维持 getConfigData 的调用契约，便于未来按需恢复。
export default async function getGoodDiscountList() {
  return null;
}
