"use client";

import React from "react";
import Cookies from "js-cookie";
import { useGoogleOneTapLogin } from "@react-oauth/google";
import { useParams } from "next/navigation";
import exchangeGoogleCredential from "./exchange";

const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

/**
 * 全站 Google One Tap 一键登录弹窗。
 * 仅在「已配置 ClientID」且「当前未登录(无 token cookie)」时启用；
 * 登录成功后 reload 当前页以刷新导航等登录态 UI。
 */
export default function GoogleOneTap() {
  const { locale } = useParams();
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
      if (ok) window.location.reload();
    },
    onError: () => {
      // One Tap 静默失败不打扰用户，仍可走页面内的按钮登录
    },
  });

  return null;
}
