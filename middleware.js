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

  // 解析来源分「显式」(URL 参数 / URL 路径 locale / 已有 cookie —— 用户真实意图或历史选择)
  // 与「兜底」(Accept-Language / 默认值 —— 仅是猜测)。显式意图最高优先。
  const areaExplicit = url_area_code || cookieArea;
  const localeExplicit = url_language_code || pathLocale || cookieLocale;

  // area：显式来源 → 浏览器地区 → 默认市场（来自 setting.markets）
  const area = resolveArea(
    areaExplicit || getAcceptLanguageArea(request) || defaultArea
  );

  // locale：显式来源 → 浏览器语言 → 默认语言。
  const locale = resolveLocale(
    localeExplicit || getAcceptLanguageLocale(request)
  );

  request.locale = locale;
  request.area = area;
  const returnOptions = i18nRouter(request, i18nConfig);

  // cookie 加固：长期有效 + path=/ + SameSite=Lax；https 下加 Secure（与客户端 localePrefs 一致）。
  const expires = new Date(Date.now() + 720 * 24 * 60 * 60 * 1000);
  const secure = request.nextUrl.protocol === "https:";
  const cookieOpts = {
    expires,
    path: "/",
    sameSite: "lax",
    ...(secure ? { secure: true } : {})
  };

  // 关键：只在 cookie 值「实际变化」时才 Set-Cookie。
  //
  // Next.js App Router 的坑：middleware 在每个请求(含 RSC 软跳/预取)都写 Set-Cookie，会让
  // 客户端把该导航响应视为「有副作用/动态」→ 首次客户端导航退化成整页硬跳(MPA 导航)——
  // 表现为「点一下刷新、第二次才软跳」，且站内几乎所有跳转普遍中招。稳定用户值未变则不写，
  // 响应无 Set-Cookie 可被路由缓存复用 → 软跳恢复正常。
  //
  // 同时保留两条既有约束：① 仅显式来源(URL/路径/已有 cookie)才写，纯 Accept-Language/默认
  // 兜底不写，避免把浏览器语言猜测写死(退后台丢 cookie → 永久切中文的放大器)；② 首访语言
  // 仍由兜底渲染，待进入带 locale 前缀的 URL 后自然落盘。
  if (localeExplicit && locale !== cookieLocale) {
    returnOptions.cookies.set("locale", locale, cookieOpts);
  }
  if (areaExplicit && area !== cookieArea) {
    returnOptions.cookies.set("area", area, cookieOpts);
  }

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
    redirect.cookies.set("NEXT_LOCALE", locale, cookieOpts);
    redirect.cookies.set("locale", locale, cookieOpts);
    redirect.cookies.set("area", area, cookieOpts);
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
