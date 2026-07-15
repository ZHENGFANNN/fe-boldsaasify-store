"use client";

import React from "react";
import LoginModule from "../LoginModule";
import styles from "./index.module.scss";

const T = (LANG, key, fallback) => LANG?.[key] || fallback;

/**
 * 未登录守卫卡片：锁图标 + 主副标题 + LoginModule（Google + OR + Log in / Register）。
 * 用于售后详情/进度/创建三处的未登录状态。
 */
export default function AuthRedirectGuard({ LANG, redirectPath }) {
  return (
    <div className={styles.container}>
      <div className={styles.card} data-role="auth-redirect-guard">
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
          {T(LANG, "user_account.login_guard.title", "Sign in required")}
        </h2>

        <p className={styles.desc}>
          {T(
            LANG,
            "user_account.login_guard.desc",
            "You need to sign in to use this feature. Please sign in to continue."
          )}
        </p>

        <LoginModule LANG={LANG} redirectPath={redirectPath} />
      </div>
    </div>
  );
}
