"use client";

import React from "react";
import Cookies from "js-cookie";
import { useGoogleOneTapLogin } from "@react-oauth/google";
import { useParams, usePathname } from "next/navigation";
import exchangeGoogleCredential from "./exchange";

const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

// 认证流程页：登录后停留无意义，应跳走；其余页面（商品/博客/下单等）原地刷新，
// 避免打断用户正在进行的浏览或下单流程。pathname 形如 /en/user/forget，带 locale 前缀。
const AUTH_PAGE = /\/user\/(login|register|forget|reset-password)(\/|$)/;

/**
 * 全站 Google One Tap 一键登录弹窗。
 * 仅在「已配置 ClientID」且「当前未登录(无 token cookie)」时启用；
 * 登录成功后 reload 当前页以刷新导航等登录态 UI。
 */
export default function GoogleOneTap() {
  const { locale } = useParams();
  const pathname = usePathname();
  const [hasToken, setHasToken] = React.useState(true); // 默认禁用，挂载后再判断，避免 SSR 抖动

  React.useEffect(() => {
    setHasToken(Boolean(Cookies.get("token")));
  }, []);

  useGoogleOneTapLogin({
    disabled: !CLIENT_ID || hasToken,
    cancel_on_tap_outside: false,
    onSuccess: async (credentialResponse) => {
      const credential = credentialResponse?.credential;
      if (!credential) return;
      const { ok } = await exchangeGoogleCredential(credential, locale);
      if (ok) {
        if (AUTH_PAGE.test(pathname || "")) {
          // 认证入口页停留无意义：优先尊重 ?redirect=（如从下单页被拦来登录），
          // 否则回首页。与页面内 Google 按钮的跳转行为保持一致。
          const redirect = new URLSearchParams(location.search).get("redirect");
          const target = redirect
            ? redirect.endsWith("/")
              ? redirect.slice(0, -1)
              : redirect
            : `/${locale}`;
          window.location.href = target;
        } else {
          // 其余页面（商品/博客/下单等）原地刷新即可更新导航登录态，不打断当前流程
          window.location.reload();
        }
      }
    },
    onError: () => {
      // One Tap 静默失败不打扰用户，仍可走页面内的按钮登录
    },
  });

  return null;
}
