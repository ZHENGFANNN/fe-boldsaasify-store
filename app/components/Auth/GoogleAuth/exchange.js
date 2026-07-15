import Api from "@/[locale]/user/api";
import Cookies from "js-cookie";

/**
 * 用 Google 返回的 ID Token(credential) 换取本站登录态。
 * 成功后把后端下发的 JWT 落到 token cookie（与邮箱登录一致，7 天），
 * 后续请求由 axios 拦截器注入 Authorization: Bearer 头。
 *
 * @param {string} credential  Google Identity Services 返回的 ID Token
 * @param {string} locale      当前语言，作为新用户的 language（注册必填项）
 * @returns {Promise<{ok: boolean, res?: any}>}
 */
export default async function exchangeGoogleCredential(credential, locale) {
  const area = Cookies.get("area") || "us";
  const res = await Api.userGoogleLogin({
    credential,
    area,
    language: locale,
  });
  if (res?.code === 0 && res?.data) {
    Cookies.set("token", res.data, { expires: 7 });
    return { ok: true, res };
  }
  return { ok: false, res };
}
