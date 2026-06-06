import { i18nRouter } from "next-i18n-router";
import i18nConfig from "@@/i18nConfig";

import { countryMap } from "./app/config/COUNTRY";

import qs from "qs";
import parser from "accept-language-parser";
import { NextResponse } from "next/server";

// 判断浏览器设置的地区
function getAcceptLanguageArea(request) {
  const requestHeaders = new Headers(request.headers);
  const acceptLanguage = requestHeaders.get("accept-language");
  const areaList = parser.parse(acceptLanguage);
  let area = null;
  areaList.find((item) => {
    if (countryMap[item.region?.toLowerCase()]) {
      area = item.region.toLowerCase();
      return true;
    }
  });
  return area;
}

// 判断URL上是否有参数
function getUrlAreaCode(request) {
  const search = request.nextUrl.search.split("?")[1];
  const { area_code } = qs.parse(search);
  return area_code;
}

export async function middleware(request) {
  let area = request.cookies.get("area")?.value;
  let locale = request.cookies.get("locale")?.value;
  /**
   * 功能：
   *  1、判断地区Cookie是否存在
   *  2、不存在则通过参数判断
   *  3、客户端浏览器再次判断
   *  4、默认为us
   * 作用：获取地区
   */
  // （1）判断cookie是否存在area（地区）
  if (!area) {
    // （2）判断URL上是否有参数
    const urlAreaCode = getUrlAreaCode(request);
    if (urlAreaCode) {
      area = urlAreaCode;
    } else {
      // （3）判断浏览器设置的地区
      const acceptLanguageAreaCode = getAcceptLanguageArea(request);
      if (acceptLanguageAreaCode) {
        area = acceptLanguageAreaCode;
      } else {
        // （4）默认为us
        area = "us";
      }
    }
  }

  // 判断area是否合法
  if (countryMap[area]?.language_code) {
    locale = countryMap[area].language_code;
  } else {
    area = "us";
    locale = "en";
  }

  // 设置多语言
  request.locale = locale;
  request.area = area;
  const returnOptions = i18nRouter(request, i18nConfig);
  // 设置Cookie
  const expires = new Date(Date.now() + 720 * 24 * 60 * 60 * 1000);
  returnOptions.cookies.set("locale", locale, {
    expires,
  });
  returnOptions.cookies.set("area", area, {
    expires,
  });

  // 判断URL与locale是否一致;
  const curLocale =
    returnOptions.headers.get("x-next-i18n-router-locale") || "en";
  if (curLocale !== locale) {
    let baseUrl;
    // 特殊处理英文
    if (curLocale === "en") {
      // 只去除作为路径首段的 /en 前缀（用 (?=/|$) 锚定段尾），
      // 否则 /product/engagement-ring 这类路径里的 "/en" 会被误删，
      // 变成 /productgagement-ring 而 404。
      baseUrl = `/${locale}${request.nextUrl.pathname.replace(
        /^\/en(?=\/|$)/,
        ""
      )}${request.nextUrl.search}`;
    } else {
      // 同理，只替换作为首段的当前 locale 前缀，避免命中路径中间的子串。
      baseUrl = `${request.nextUrl.pathname.replace(
        new RegExp(`^/${curLocale}(?=/|$)`),
        `/${locale}`
      )}${request.nextUrl.search}`;
    }
    const origin = request.nextUrl.origin;
    return NextResponse.redirect(`${origin}${baseUrl}`);
  }

  // 其他选项处理：设置请求头
  returnOptions.headers.set("x-request-url", request.url);

  return returnOptions;
}

export const config = {
  matcher: "/((?!service|static|config|icon|.*\\..*|_next).*)",
};
