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

export async function proxy(request) {
  const {
    area_code: url_area_code,
    language_code: url_language_code
  } = getUrlParams(request);
  const cookieArea = request.cookies.get("area")?.value;
  const cookieLocale = request.cookies.get("locale")?.value;

  // area：URL 参数 → Cookie → 浏览器地区 → 默认市场（来自 setting.markets）
  const area = resolveArea(
    url_area_code || cookieArea || getAcceptLanguageArea(request) || defaultArea
  );

  // locale：URL 参数 → Cookie → 浏览器语言 → setting.language 默认语言
  const locale = resolveLocale(
    url_language_code || cookieLocale || getAcceptLanguageLocale(request)
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
    return NextResponse.redirect(`${request.nextUrl.origin}${baseUrl}`);
  }

  returnOptions.headers.set("x-request-url", request.url);

  return returnOptions;
}

export const config = {
  matcher: "/((?!api|service|static|config|icon|.*\\..*|_next).*)"
};
