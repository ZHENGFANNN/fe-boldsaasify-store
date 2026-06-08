// Places Autocomplete 前端辅助。
// 后端代理 Google Places(New)：前端只负责管理 session token、防抖、取消过期请求，
// 真正的 Google 调用在后端（key 不进前端 bundle）。

/**
 * 生成一个 Autocomplete session token。
 * 同一次输入会话（多次联想 + 最终取详情）复用同一个 token，Google 按会话计费。
 * 选中某条结果后应丢弃旧 token、下次输入再生成新的。
 */
export function newSessionToken() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // 兜底：极少数老环境没有 crypto.randomUUID
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
