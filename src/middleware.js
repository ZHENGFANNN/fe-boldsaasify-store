import { i18nRouter } from "next-i18n-router";
import i18nConfig from "@@/i18nConfig";

import COUNTRYLIST from "@/config/COUNTRYLIST";
import LANGUAGES from "@/config/LANGUAGE";

import qs from "qs";
import parser from "accept-language-parser";
import { NextResponse } from "next/server";

export function middleware(request) {
  let area = request.cookies.get("area")?.value;
  let locale = request.cookies.get("locale")?.value;
  /**
   * 功能：
   *  1、判断地区Cookie是否存在
   *  2、不存在则通过路径判断
   *  3、客户端浏览器再次判断
   *  4、再通过本地locale判断
   *  5、默认为us
   * 作用：获取地区
   */
  // （1）判断cookie是否存在area（地区）
  if (!area) {
    // （2）判断URL上是否有参数
    const search = request.nextUrl.search.split("?")[1];
    const { area_code } = qs.parse(search);
    if (area_code) {
      area = area_code;
    } else {
      // （3）判断浏览器设置的地区
      const requestHeaders = new Headers(request.headers);
      const acceptLanguage = requestHeaders.get("accept-language");
      const areaList = parser.parse(acceptLanguage);
      const index = areaList.find((item) => {
        if (COUNTRYLIST("map")[item.region?.toLowerCase()]) {
          area = item.region.toLowerCase();
          return true;
        }
      });
      // 浏览器获取不到地区
      if (index == undefined) {
        // （4）获取language的Cookie
        const cookieLang = locale;
        if (LANGUAGES("map")[cookieLang]) {
          area = LANGUAGES("map")[cookieLang].area;
        } else {
          // (5)默认为us
          area = "us";
        }
      }
    }
  }
  // 判断area是否合法
  if (COUNTRYLIST("map")[area]?.language_code) {
    locale = COUNTRYLIST("map")[area].language_code;
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
      baseUrl = `/${locale}${
        request.nextUrl.pathname === "/" ? "" : request.nextUrl.pathname
      }${request.nextUrl.search}`;
    } else {
      // ** BUG修复 ** 全局替换问题
      // baseUrl = `${request.nextUrl.pathname.split(curLocale).join(locale)}${
      //   request.nextUrl.search
      // }`;

      baseUrl = `${request.nextUrl.pathname.replace(curLocale, locale)}${
        request.nextUrl.search
      }`;
    }
    const origin = request.nextUrl.origin;
    return NextResponse.redirect(`${origin}${baseUrl}`);
  }
  return returnOptions;
}

export const config = {
  matcher: "/((?!api|static|.*\\..*|_next).*)",
};
