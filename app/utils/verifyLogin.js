/** @format */

import request from "@/request";

/**
 * 校验登录态并拉取用户信息（结算页 / 账户页共用）。
 *
 * 关键：区分「token 真失效」与「网络/超时等瞬时错误」。
 * 后端 /user/tokenLogin 只读 Redis session、响应极快，但网关/后端偶发抖动会让
 * 请求整段超时。旧代码把「超时」和「登录过期」一视同仁：请求一失败就删掉 token
 * 并登出用户，导致明明已登录却被判为游客、页头与结算/账户页登录态不一致、点
 * My account 反被弹回登录页。
 *
 * 这里只在服务端「明确判定失效」（有响应且 code!==0，或 401/403）时才算 invalid；
 * 网络/超时（无 HTTP 响应）视为瞬时错误（error），调用方保留 token 不登出。
 * 连接层的自动重试（新建连接绕开失效 keep-alive socket）由 @/request 的响应
 * 拦截器统一对幂等 GET 处理，这里不再自行重试，避免双重重试。
 *
 * @param {{timeout?: number}} [options]
 * @returns {Promise<
 *   | { status: "ok", data: any }   // 已登录，data 为用户信息
 *   | { status: "invalid" }         // 服务端判定登录态失效，调用方应清 token 降级
 *   | { status: "error", error: any } // 网络/超时等瞬时错误，调用方应保留 token
 * >}
 */
export default async function verifyLogin({ timeout = 10000 } = {}) {
  try {
    const res = await request.get("/user/tokenLogin", { timeout });
    if (res?.code === 0) return { status: "ok", data: res.data };
    // 服务端有响应但判定登录态失效（登录过期）
    return { status: "invalid" };
  } catch (error) {
    // 真正的鉴权失败（服务端有响应）→ 判失效
    const httpStatus = error?.response?.status;
    if (httpStatus === 401 || httpStatus === 403) return { status: "invalid" };
    // 网络/超时（无响应，连接层已重试过一次仍失败）→ 保留 token
    return { status: "error", error };
  }
}
