"use client";

import React from "react";
import GlobalContext from "@/[locale]/context";
import { GDPR_REGION_LIST } from "@/components/Layout/CookieModal/const";

// 已保存的用户偏好（数组，如 ["functional","analytical","marketing"]）存 localStorage。
const STORAGE_KEY = "cookie_permissions_list";
// 偏好变更广播事件：写入后 dispatch，让所有 useCookieConsent 消费方（尤其脚本 gate）即时更新。
const CHANGE_EVENT = "cookie-consent-change";

// 读原始偏好列表；未决定返回 null。
function readStored() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * 写入用户偏好并广播变更。CookieAlert / CookieSetting 保存时调用，
 * 使脚本 gate（AnalyticsGate）等消费方即时按新偏好加载/停留。
 * @param {string[]} list 允许的类别（functional/analytical/marketing 的子集）
 */
export function setCookieConsent(list) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {}
  try {
    window.dispatchEvent(new Event(CHANGE_EVENT));
  } catch {}
}

/**
 * 由「当前站点 area」+「已保存偏好」推导有效同意。
 * 未决定（stored=null）时按合规地区给默认：
 *   - GDPR 地区（欧盟/EEA/英国/瑞士）→ opt-in：非必要项默认关（不自动加载）
 *   - 其它（美国等）→ opt-out：默认开（可自动加载）
 * essential（必要）恒为 true。
 */
export function computeConsent(area, stored) {
  const isGdpr = !!area && GDPR_REGION_LIST.includes(area);
  if (Array.isArray(stored)) {
    return {
      decided: true,
      isGdpr,
      essential: true,
      functional: stored.includes("functional"),
      analytical: stored.includes("analytical"),
      marketing: stored.includes("marketing"),
    };
  }
  const dflt = !isGdpr; // 非 GDPR 地区默认开
  return {
    decided: false,
    isGdpr,
    essential: true,
    functional: dflt,
    analytical: dflt,
    marketing: dflt,
  };
}

/**
 * 公共 Cookie 同意 hook。返回各类别有效开关 + ready。
 *
 * 用法（在引入脚本处按开关加载）：
 *   const consent = useCookieConsent();
 *   if (consent.ready && consent.analytical) { 加载分析脚本 }
 *
 * 地区取当前站点 area（GlobalContext，来自 area cookie），不依赖 IP。
 * ready=false 前不应加载任何非必要脚本：避免 GDPR 地区在读到真实 area/已存偏好前误加载。
 */
export function useCookieConsent() {
  const ctx = React.useContext(GlobalContext);
  const area = ctx?.area;
  const areaReady = ctx?.areaReady ?? false;

  const [stored, setStored] = React.useState(null);
  const [storedReady, setStoredReady] = React.useState(false);

  React.useEffect(() => {
    const sync = () => {
      setStored(readStored());
      setStoredReady(true);
    };
    sync();
    window.addEventListener(CHANGE_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(CHANGE_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const ready = areaReady && storedReady;
  return React.useMemo(
    () => ({ ready, ...computeConsent(area, stored) }),
    [ready, area, stored]
  );
}

export default useCookieConsent;
