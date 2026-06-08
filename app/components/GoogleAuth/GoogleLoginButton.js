"use client";

import React from "react";
import { GoogleLogin } from "@react-oauth/google";
import { useParams, useSearchParams } from "next/navigation";
import exchangeGoogleCredential from "./exchange";

const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

/**
 * 「使用 Google 登录」按钮（Google 官方渲染，自带多语言）。
 * 登录成功后落 token cookie 并跳转：有 redirect 参数则回跳，否则去账户页。
 * onSuccess/onError 可由父组件传入用于弹提示。
 */
export default function GoogleLoginButton({ onSuccess, onError }) {
  const { locale } = useParams();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect");

  if (!CLIENT_ID) return null;

  const handleSuccess = async (credentialResponse) => {
    const credential = credentialResponse?.credential;
    if (!credential) {
      onError && onError();
      return;
    }
    try {
      const { ok } = await exchangeGoogleCredential(credential, locale);
      if (ok) {
        onSuccess && onSuccess();
        const target =
          redirect && redirect.endsWith("/")
            ? redirect.slice(0, -1)
            : redirect;
        setTimeout(() => {
          location.href = target || "/user/account";
        }, 500);
      } else {
        onError && onError();
      }
    } catch {
      onError && onError();
    }
  };

  return (
    <GoogleLogin
      onSuccess={handleSuccess}
      onError={() => onError && onError()}
      width="320"
      locale={locale}
      text="continue_with"
      shape="rectangular"
    />
  );
}
