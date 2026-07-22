/** @format */

// ============================================================
// 运行时 API · 商品定制字段（客户端）
//   - uploadCustomizeFile：定制 file 类型字段上传，复用 /chat/upload（与 LiveChat 同端点）
// 定制字段配置已下沉 user-service，随 /config/getProductPage 一并下发，
// 前端经 ProductContext 透传，不再单独调用 order-service /pay/getCustomizeFields。
// 公开接口，无需登录。复用 @/request axios 实例（baseURL=NEXT_PUBLIC_HOST）。
// ============================================================

import Api from "@/request";

/**
 * 上传定制文件，复用 LiveChat 的 /chat/upload（multipart，字段名 "file"）。
 * @param {File} file
 * @returns {Promise<{url,name,type,size}>}
 */
export function uploadCustomizeFile(file) {
  const form = new FormData();
  form.append("file", file);
  form.append("scene", "order"); // 商品定制字段文件 → private/order
  return Api.post("/chat/upload", form);
}
