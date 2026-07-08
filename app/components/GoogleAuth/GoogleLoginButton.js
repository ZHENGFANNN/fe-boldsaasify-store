"use client";

import React from "react";
import { GoogleLogin } from "@react-oauth/google";
import { useParams } from "next/navigation";
import exchangeGoogleCredential from "./exchange";

const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

/**
 * 「使用 Google 登录」按钮（Google 官方渲染，自带多语言）。
 * 登录成功后落 token cookie 并跳转：URL redirect 参数 > redirectTo prop > 账户页。
 * redirectTo 供结账页等内嵌场景传当前页 URL，登录后原地回跳刷新登录态。
 * onSuccess/onError 可由父组件传入用于弹提示。
 */
export default function GoogleLoginButton({ onSuccess, onError, redirectTo }) {
  const { locale } = useParams();
  // redirect 来自 URL query，挂载后从 window 读取，避免 useSearchParams 触发
  // 静态预渲染的 CSR bailout（需 Suspense 包裹），使登录/注册页可整页静态化。
  const [redirect, setRedirect] = React.useState(null);
  React.useEffect(() => {
    setRedirect(new URLSearchParams(location.search).get("redirect"));
  }, []);

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
          location.href = target || redirectTo || "/user/account";
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
