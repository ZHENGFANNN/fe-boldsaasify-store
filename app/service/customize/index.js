/** @format */

// ============================================================
// 运行时 API · 商品定制字段（客户端）
//   - getCustomizeFields：拉某商品「已启用」的定制字段（按 weight 排序）
//   - uploadCustomizeFile：定制 file 类型字段上传，复用 /chat/upload（与 LiveChat 同端点）
// 公开接口，无需登录。复用 @/request axios 实例（baseURL=NEXT_PUBLIC_HOST）。
// language 入参直接用 locale（与 getProductOptions/getProductPricing 的 locale→language 一致）。
// ============================================================

import Api from "@/request";

/**
 * 拉取商品定制字段（仅 enabled，按 weight 升序，后端已处理）。
 * @param {{ good_key:string, good_sort_key:string, language:string }} params
 * @returns {Promise<Array>} field 列表；失败返回 []
 */
export function getCustomizeFields({ good_key, good_sort_key, language }) {
  return Api.get("/pay/getCustomizeFields", {
    params: { good_key, good_sort_key, language }
  });
}

/**
 * 上传定制文件，复用 LiveChat 的 /chat/upload（multipart，字段名 "file"）。
 * @param {File} file
 * @returns {Promise<{url,name,type,size}>}
 */
export function uploadCustomizeFile(file) {
  const form = new FormData();
  form.append("file", file);
  return Api.post("/chat/upload", form);
}
