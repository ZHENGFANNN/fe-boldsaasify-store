/**
 * i18n / 地区路由拦截。
 *
 * Next 16 已将 middleware 重命名为 proxy（固定 Node.js runtime），
 * 但 @opennextjs/cloudflare 仅支持 Edge middleware，故保留 middleware.js。
 * 构建时会有弃用警告，CF 部署可正常工作。
 */
import { i18nRouter } from "next-i18n-router";
import i18nConfig from "@@/i18nConfig";
import {
  resolveLocale,
  defaultLocale,
  locales
} from "./app/config/languageSettings";
import {
  resolveArea,
  defaultArea,
  supportedAreas
} from "./app/config/marketSettings";

import qs from "qs";
import parser from "accept-language-parser";
import { NextResponse } from "next/server";

function getUrlParams(request) {
  const search = request.nextUrl.search.split("?")[1];
  if (!search) return {};
  const { area_code, language_code } = qs.parse(search);
  return { area_code, language_code };
}

function getAcceptLanguageArea(request) {
  const acceptLanguage = request.headers.get("accept-language");
  if (!acceptLanguage) return null;
  const areaList = parser.parse(acceptLanguage);
  for (const item of areaList) {
    const region = item.region?.toLowerCase();
    if (region && supportedAreas.includes(region)) return region;
  }
  return null;
}

function getAcceptLanguageLocale(request) {
  const acceptLanguage = request.headers.get("accept-language");
  if (!acceptLanguage) return null;
  const parsed = parser.parse(acceptLanguage);
  for (const item of parsed) {
    if (item.code && item.region) {
      const iso = `${item.code}-${item.region}`.toLowerCase();
      if (locales.includes(iso)) return iso;
    }
    const code = item.code?.toLowerCase();
    if (code && locales.includes(code)) return code;
  }
  return null;
}

/**
 * 根据目标语言重写路径（用于 Cookie/参数决定的 locale 与 URL 不一致时 302）。
 *
 * next-i18n-router 约定：defaultLocale（当前为 en）不带前缀，其它语言带 /{locale}。
 * 示例（defaultLocale = en）：
 *   /product/foo           + en → zh-cn  => /zh-cn/product/foo
 *   /zh-cn/product/foo     + zh-cn → en => /product/foo
 *   /en/product/foo        + en → zh-cn  => /zh-cn/product/foo（先去掉多余的 /en）
 *
 * 正则里的 (?=/|$) 只匹配「路径首段的 locale」，避免误删
 * /product/engagement-ring 等路径中间的子串。
 */
function buildLocalizedPath(pathname, fromLocale, toLocale) {
  let path = pathname;

  // 1. 去掉当前 URL 上的 locale 前缀，得到语言无关的路径
  if (fromLocale !== defaultLocale) {
    path = path.replace(new RegExp(`^/${fromLocale}(?=/|$)`), "") || "/";
  } else {
    // 默认语言通常无前缀；若 URL 里仍写了 /en，也一并去掉
    path = path.replace(new RegExp(`^/${defaultLocale}(?=/|$)`), "") || "/";
  }

  // 2. 按目标语言加前缀；默认语言不再加 /en
  if (toLocale === defaultLocale) {
    return path;
  }
  return `/${toLocale}${path === "/" ? "" : path}`;
}

export async function middleware(request) {
  const {
    area_code: url_area_code,
    language_code: url_language_code
  } = getUrlParams(request);
  const cookieArea = request.cookies.get("area")?.value;
  const cookieLocale = request.cookies.get("locale")?.value;

  // 从 URL 路径首段解析已带的 locale（如 /zh-cn/... → zh-cn）。
  // 仅取「非默认」locale：默认语言(en)约定无前缀，/en 这类路径应由既有逻辑清理为 /，
  // 不能当作有效 pathLocale，否则会阻止 /en → / 的规范化。
  // 这是「用户当前正在浏览的语言」的最强兜底信号：必须优先于 accept-language，
  // 否则无 locale cookie 的用户直达 /zh-cn 时会被解析成默认 en 并被强制跳回 /，
  // 而 next-i18n-router 的 NEXT_LOCALE=zh-cn 又把 / 跳回 /zh-cn → 无限重定向。
  const pathLocaleMatch = request.nextUrl.pathname.match(/^\/([^/]+)(?=\/|$)/);
  const pathLocale =
    pathLocaleMatch &&
    locales.includes(pathLocaleMatch[1]) &&
    pathLocaleMatch[1] !== defaultLocale
      ? pathLocaleMatch[1]
      : null;

  // area：URL 参数 → Cookie → 浏览器地区 → 默认市场（来自 setting.markets）
  const area = resolveArea(
    url_area_code || cookieArea || getAcceptLanguageArea(request) || defaultArea
  );

  // locale：URL 参数 → URL 路径 locale(非默认) → Cookie → 浏览器语言 → 默认语言。
  // 显式意图（URL 参数）最高优先；其次尊重 URL 路径携带的非默认 locale，避免与路由前缀互踢。
  const locale = resolveLocale(
    url_language_code ||
      pathLocale ||
      cookieLocale ||
      getAcceptLanguageLocale(request)
  );

  request.locale = locale;
  request.area = area;
  const returnOptions = i18nRouter(request, i18nConfig);

  const expires = new Date(Date.now() + 720 * 24 * 60 * 60 * 1000);
  returnOptions.cookies.set("locale", locale, { expires });
  returnOptions.cookies.set("area", area, { expires });

  const curLocale =
    returnOptions.headers.get("x-next-i18n-router-locale") || defaultLocale;

  if (curLocale !== locale) {
    const baseUrl = `${buildLocalizedPath(
      request.nextUrl.pathname,
      curLocale,
      locale
    )}${request.nextUrl.search}`;
    const redirect = NextResponse.redirect(
      `${request.nextUrl.origin}${baseUrl}`
    );
    // 关键：重定向到目标语言路径时，同步把 next-i18n-router 的 NEXT_LOCALE 与
    // 自定义 locale/area cookie 一并写到目标值，避免残留旧 NEXT_LOCALE 在落地页
    // 再次触发反向重定向（切语言/兜底重定向后跳回原语言的根因）。
    redirect.cookies.set("NEXT_LOCALE", locale, { expires });
    redirect.cookies.set("locale", locale, { expires });
    redirect.cookies.set("area", area, { expires });
    return redirect;
  }

  returnOptions.headers.set("x-request-url", request.url);

  return returnOptions;
}

export const config = {
  // @opennextjs/cloudflare 只支持 Edge runtime 的 middleware。
  // middleware（旧名）支持 edge runtime，而 Next 16 的 proxy 不支持 edge，
  // 故保留 middleware.js + edge 以打通 Cloudflare 部署。本文件仅用 Edge 兼容 API。
  // Next 16 要求写 "experimental-edge"（"edge" 会被拒：edge runtime for rendering is experimental）。
  runtime: "experimental-edge",
  matcher: "/((?!api|service|static|config|icon|.*\\..*|_next).*)"
};
