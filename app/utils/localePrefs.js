/** @format */

/**
 * 语言/地区偏好的统一读写。
 *
 * 背景：locale/area 之前在 LanguagePicker、AreaModal、middleware 各写各的 cookie，
 * 属性不一致（无 Secure/SameSite）、且只落 cookie。移动端/微信内置 WebView 退到后台后
 * 常丢 cookie → 回前台按 Accept-Language 兜底被改成中文/中国区。
 *
 * 本模块把「写 cookie」收敛成唯一出口，并同时镜像到 localStorage（比 cookie 在 WebView 里
 * 更耐活），配合 LocalePrefsSync 在 cookie 丢失时用 localStorage 补回，抗住 cookie 被清。
 * 任何客户端写 locale/area cookie 都必须走这里，避免再出现属性不一致 / 漏镜像的问题。
 */
import Cookies from "js-cookie";
import { defaultLocale } from "@/config/languageSettings";

export const LOCALE_COOKIE = "locale";
export const NEXT_LOCALE_COOKIE = "NEXT_LOCALE";
export const AREA_COOKIE = "area";
// localStorage 镜像 key（与 cookie 分开命名，避免混读）
export const LOCALE_LS = "pref_locale";
export const AREA_LS = "pref_area";

// cookie 有效期（天）。js-cookie 的 expires 传数字即按天计。
const COOKIE_MAX_AGE_DAYS = 720;

// 统一 cookie 属性：长期有效 + path=/ + SameSite=Lax；https 下加 Secure。
// 本地 http dev 不加 Secure，否则浏览器拒绝写入导致切换失效。
function cookieOptions() {
  const secure =
    typeof window !== "undefined" && window.location?.protocol === "https:";
  return {
    path: "/",
    expires: COOKIE_MAX_AGE_DAYS,
    sameSite: "lax",
    ...(secure ? { secure: true } : {}),
  };
}

/** 写持久 cookie 的唯一出口（统一加固属性，避免各处漏加）。 */
export function setPersistentCookie(name, value) {
  if (!name || value == null || value === "") return;
  Cookies.set(name, value, cookieOptions());
}

function lsSet(key, value) {
  try {
    if (typeof window !== "undefined") window.localStorage.setItem(key, value);
  } catch {
    /* 隐私模式 / 禁用存储时静默 */
  }
}

function lsGet(key) {
  try {
    if (typeof window !== "undefined") return window.localStorage.getItem(key);
  } catch {
    /* ignore */
  }
  return null;
}

/**
 * 保存语言偏好：locale + NEXT_LOCALE cookie + localStorage 镜像。
 * 切换语言（LanguagePicker）与丢失补回（LocalePrefsSync）唯一入口。
 */
export function saveLocalePref(locale) {
  if (!locale) return;
  setPersistentCookie(LOCALE_COOKIE, locale);
  setPersistentCookie(NEXT_LOCALE_COOKIE, locale);
  lsSet(LOCALE_LS, locale);
}

/**
 * 保存地区偏好：area cookie + localStorage 镜像。
 * 切换地区（AreaModal）与丢失补回（LocalePrefsSync）唯一入口。
 */
export function saveAreaPref(area) {
  if (!area) return;
  setPersistentCookie(AREA_COOKIE, area);
  lsSet(AREA_LS, area);
}

export function getStoredLocale() {
  return lsGet(LOCALE_LS);
}

export function getStoredArea() {
  return lsGet(AREA_LS);
}

/**
 * buildLocalizedPath：与 middleware 同款路径改写——去掉当前 locale 前缀得语言无关路径，
 * 再按目标语言加前缀（默认语言不带前缀）。抽到公共模块供 LanguagePicker 与 LocalePrefsSync 复用。
 */
export function buildLocalizedPath(pathname, fromLocale, toLocale) {
  let path = pathname || "/";
  const from =
    fromLocale && fromLocale !== defaultLocale ? fromLocale : defaultLocale;
  path = path.replace(new RegExp(`^/${from}(?=/|$)`), "") || "/";
  if (toLocale === defaultLocale) return path;
  return `/${toLocale}${path === "/" ? "" : path}`;
}
