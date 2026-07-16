import { locales, defaultLocale } from "@/config/languageSettings";

/**
 * 需要登录校验的路由前缀（locale 无关，用「去掉 locale 前缀后」的 pathname 匹配）。
 *
 * 只列「纯 cookie 登录态即可判定」的整页受保护路由；数据驱动的多重门禁页
 * （如 /order/info：login/forbidden/email 由后端 code 2107/10029/2108 决定、
 * 支持游客凭邮箱查单）不在此列，仍由页面内联处理，切勿加进来否则游客查单会被误挡。
 */
export const AUTH_REQUIRED_PREFIXES = [
  "/support/after-sales",
  "/user/account",
];

/**
 * 去掉 pathname 首段的 locale 前缀，得到语言无关路径。
 * 约定：defaultLocale(en) 无前缀；其它 locale 形如 /zh-cn/...。
 * 与 middleware.buildLocalizedPath 的 locale 前缀约定保持一致。
 */
export function stripLocalePrefix(pathname) {
  if (!pathname) return "/";
  const seg = pathname.match(/^\/([^/]+)(?=\/|$)/)?.[1];
  if (seg && seg !== defaultLocale && locales.includes(seg)) {
    return pathname.replace(new RegExp(`^/${seg}(?=/|$)`), "") || "/";
  }
  return pathname;
}

/** 当前 pathname 是否命中受保护前缀。 */
export function isProtectedPath(pathname) {
  const path = stripLocalePrefix(pathname);
  return AUTH_REQUIRED_PREFIXES.some(
    (p) => path === p || path.startsWith(`${p}/`)
  );
}
