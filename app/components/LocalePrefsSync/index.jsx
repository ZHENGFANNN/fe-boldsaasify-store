"use client";

import React from "react";
import { usePathname } from "next/navigation";
import Cookies from "js-cookie";

import { defaultLocale } from "@/config/languageSettings";
import {
  LOCALE_COOKIE,
  AREA_COOKIE,
  getStoredLocale,
  getStoredArea,
  saveLocalePref,
  saveAreaPref,
  buildLocalizedPath,
} from "@/utils/localePrefs";

/**
 * 语言/地区偏好补偿。挂在全局 Layout，客户端挂载后跑一次。
 *
 * 移动端/微信 WebView 退到后台常丢 cookie，回前台的无 cookie 请求会被 middleware 按
 * Accept-Language 兜底改成中文/中国区（且 middleware 重定向分支会把这个兜底值写进 cookie，
 * 所以「cookie 不存在才补」是不够的）。这里以 localStorage 镜像（用户显式选择的耐久记录、
 * 比 cookie 更抗 WebView 清除）为准，纠正被兜底改乱的语言/地区：
 *   - locale：当前渲染语言(URL) 与镜像不一致 → 恢复 cookie 并整页跳转回镜像语言；
 *             一致但 cookie 丢/不符 → 静默补回 cookie（无需跳转）
 *   - area：cookie 与镜像不一致（被改或丢了）→ 恢复并 reload 使地区相关渲染生效
 *
 * 真首访（从未选过语言/地区 → 无 localStorage 镜像）不动，语言仍交给 Accept-Language 兜底。
 *
 * @param {string} locale 服务端按 URL 解析出的当前语言（= 当前页面渲染语言）
 */
export default function LocalePrefsSync({ locale }) {
  const pathname = usePathname();

  React.useEffect(() => {
    let needReload = false;

    // area：镜像是显式选择的耐久记录；与当前 cookie 不一致（被兜底改了或 cookie 丢了）→ 恢复
    const storedArea = getStoredArea();
    if (storedArea && Cookies.get(AREA_COOKIE) !== storedArea) {
      saveAreaPref(storedArea);
      needReload = true;
    }

    // locale：与当前渲染语言(URL) 不一致 → 恢复 cookie 并纠正 URL（整页跳转，顺带带上已恢复的 area）
    const storedLocale = getStoredLocale();
    if (storedLocale) {
      const current = locale || defaultLocale;
      if (current !== storedLocale) {
        saveLocalePref(storedLocale);
        window.location.href =
          buildLocalizedPath(pathname, current, storedLocale) || "/";
        return; // 跳转会重载，area 亦随之生效
      }
      // 语言一致但 cookie 丢/不符 → 静默补回，无需跳转
      if (Cookies.get(LOCALE_COOKIE) !== storedLocale) {
        saveLocalePref(storedLocale);
      }
    }

    if (needReload) window.location.reload();
    // 一次性补偿；取挂载时的 locale/pathname 即可
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
