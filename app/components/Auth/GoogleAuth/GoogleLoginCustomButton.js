"use client";

import React from "react";
import { GoogleLogin } from "@react-oauth/google";
import { useParams } from "next/navigation";
import exchangeGoogleCredential from "./exchange";
import styles from "./GoogleLoginCustomButton.module.scss";

const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

// Google 官方按钮宽度上限为 400px；通过 transform: scaleX 将透明覆盖层横向拉伸到容器宽度，
// 让视觉自定义按钮的整个区域都能承接点击（点击命中率等价于原生按钮）。
const GOOGLE_BUTTON_MAX_WIDTH = 400;

export default function GoogleLoginCustomButton({
  label,
  onSuccess,
  onError,
  redirectTo,
}) {
  const { locale } = useParams();
  const wrapRef = React.useRef(null);
  const [scaleX, setScaleX] = React.useState(1);
  const [redirect, setRedirect] = React.useState(null);

  React.useEffect(() => {
    setRedirect(new URLSearchParams(location.search).get("redirect"));
  }, []);

  React.useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const update = () => {
      const w = el.offsetWidth || GOOGLE_BUTTON_MAX_WIDTH;
      setScaleX(Math.max(w / GOOGLE_BUTTON_MAX_WIDTH, 1));
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
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
        // 登录成功后直接跳转，去掉原 500ms 延迟（消除跳转前的卡顿感）。
        location.href = target || redirectTo || "/user/account";
      } else {
        onError && onError();
      }
    } catch {
      onError && onError();
    }
  };

  return (
    <div className={styles.wrap} ref={wrapRef}>
      <div className={styles.visual} aria-hidden="true">
        <svg
          className={styles.icon}
          viewBox="0 0 24 24"
          width="20"
          height="20"
        >
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1Z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.26 1.05-3.71 1.05-2.86 0-5.29-1.93-6.15-4.53H2.18v2.85A11 11 0 0 0 12 23Z"
          />
          <path
            fill="#FBBC05"
            d="M5.85 14.09a6.6 6.6 0 0 1 0-4.18V7.07H2.18a11 11 0 0 0 0 9.87l3.67-2.85Z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1a11 11 0 0 0-9.82 6.07l3.67 2.85C6.71 7.31 9.14 5.38 12 5.38Z"
          />
        </svg>
        <span className={styles.text}>{label || "Continue with Google"}</span>
      </div>
      <div
        className={styles.overlay}
        style={{ transform: `scaleX(${scaleX})` }}
      >
        <GoogleLogin
          onSuccess={handleSuccess}
          onError={() => onError && onError()}
          width={GOOGLE_BUTTON_MAX_WIDTH}
          locale={locale}
          text="continue_with"
          shape="rectangular"
          size="large"
        />
      </div>
    </div>
  );
}
