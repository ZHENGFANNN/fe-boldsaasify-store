import { i18nRouter } from "next-i18n-router";
import i18nConfig from "@@/i18nConfig";
import {
  resolveLocale,
  defaultLocale,
  locales,
} from "./app/config/languageSettings";

import { countryMap } from "./app/config/COUNTRY";

import qs from "qs";
import parser from "accept-language-parser";
import { NextResponse } from "next/server";

const DEFAULT_AREA = "us";

function getUrlParams(request) {
  const search = request.nextUrl.search.split("?")[1];
  if (!search) return {};
  const { area_code, language_code } = qs.parse(search);
  return { area_code, language_code };
}

// 从浏览器 Accept-Language 推断 market area（仅用于 area，与 locale 无关）
function getAcceptLanguageArea(request) {
  const acceptLanguage = request.headers.get("accept-language");
  if (!acceptLanguage) return null;
  const areaList = parser.parse(acceptLanguage);
  for (const item of areaList) {
    const region = item.region?.toLowerCase();
    if (region && countryMap[region]) return region;
  }
  return null;
}

// 从浏览器 Accept-Language 推断 locale（仅用于 locale，与 area 无关）
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

function resolveArea(area) {
  if (area && countryMap[area]) return area;
  return DEFAULT_AREA;
}

function buildLocalizedPath(pathname, fromLocale, toLocale) {
  let path = pathname;
  if (fromLocale !== defaultLocale) {
    path = path.replace(new RegExp(`^/${fromLocale}(?=/|$)`), "") || "/";
  } else {
    path = path.replace(new RegExp(`^/${defaultLocale}(?=/|$)`), "") || "/";
  }
  if (toLocale === defaultLocale) {
    return path;
  }
  return `/${toLocale}${path === "/" ? "" : path}`;
}

export async function middleware(request) {
  const { area_code, language_code } = getUrlParams(request);
  const cookieArea = request.cookies.get("area")?.value;
  const cookieLocale = request.cookies.get("locale")?.value;

  // area：URL 参数 → Cookie → 浏览器地区 → 默认 us（与 locale 无关）
  const area = resolveArea(
    area_code ||
      cookieArea ||
      getAcceptLanguageArea(request) ||
      DEFAULT_AREA
  );

  // locale：URL 参数 → Cookie → 浏览器语言 → setting.language 默认语言（与 area 无关）
  const locale = resolveLocale(
    language_code || cookieLocale || getAcceptLanguageLocale(request)
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
  matcher: "/((?!service|static|config|icon|.*\\..*|_next).*)",
};
