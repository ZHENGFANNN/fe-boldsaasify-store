"use client";

import React from "react";
import { useRouter } from "next/navigation";
import styles from "./index.module.scss";

// 文案兜底：语言包暂未配置 user_account.after_sale.login_guard.* 时用英文兜底
const T = (LANG, key, fallback) => LANG?.[key] || fallback;

// 未登录停留时长（秒）；归零后自动跳转登录页
const COUNTDOWN_SECONDS = 10;

/**
 * 需要登录守卫卡片：展示温馨提示 + 倒计时，倒计时归零或点击按钮均跳转登录页。
 * redirectPath 可显式传入（各调用方 window.location.pathname + search）；
 * 未传时挂载后自动读取当前地址。
 */
export default function AuthRedirectGuard({ LANG, redirectPath }) {
  const router = useRouter();
  const [count, setCount] = React.useState(COUNTDOWN_SECONDS);
  const [loginHref, setLoginHref] = React.useState("/user/login");

  // window 仅挂载后可读（SSR 无 window），据当前路径拼登录回跳地址。
  /* eslint-disable react-hooks/set-state-in-effect */
  React.useEffect(() => {
    const path =
      redirectPath || `${window.location.pathname}${window.location.search}`;
    setLoginHref(`/user/login?redirect=${encodeURIComponent(path)}`);
  }, [redirectPath]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const goLogin = React.useCallback(() => {
    router.push(loginHref);
  }, [router, loginHref]);

  // 每秒递减；归零后由下方 effect 触发跳转
  React.useEffect(() => {
    const timer = setInterval(() => {
      setCount((c) => (c > 0 ? c - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  React.useEffect(() => {
    if (count <= 0) goLogin();
  }, [count, goLogin]);

  const desc = T(
    LANG,
    "user_account.after_sale.login_guard.desc",
    "You need to sign in to continue. Redirecting to the login page in {n}s…"
  ).replace("{n}", String(count));

  return (
    <div className={styles.guard} data-role="auth-redirect-guard">
      <div className={styles.card}>
        <div className={styles.icon}>
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <rect
              x="4"
              y="10.5"
              width="16"
              height="10"
              rx="2.5"
              stroke="currentColor"
              strokeWidth="1.6"
            />
            <path
              d="M7.5 10.5V8a4.5 4.5 0 0 1 9 0v2.5"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
            <circle cx="12" cy="15" r="1.4" fill="currentColor" />
            <path
              d="M12 16.2v1.6"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          </svg>
        </div>

        <h2 className={styles.title}>
          {T(
            LANG,
            "user_account.after_sale.login_guard.title",
            "Sign in required"
          )}
        </h2>

        <p className={styles.desc}>{desc}</p>

        <button type="button" className={styles.btn} onClick={goLogin}>
          {T(LANG, "user_account.after_sale.login_guard.button", "Sign in")}
        </button>

        <div className={styles.countdown}>
          <span className={styles.count_num}>{count}</span>
          <span className={styles.count_unit}>
            {T(LANG, "user_account.after_sale.login_guard.second", "s")}
          </span>
        </div>
      </div>
    </div>
  );
}
