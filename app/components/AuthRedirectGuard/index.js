"use client";

import React from "react";
import LoginModule from "@/components/LoginModule";
import styles from "./index.module.scss";

// 文案兜底：语言包暂未配置 user_account.login_guard.* 时用英文兜底
const T = (LANG, key, fallback) => LANG?.[key] || fallback;

/**
 * 未登录守卫卡片：展示锁图标 + 主副标题 + 内嵌 <LoginModule>（Google + OR + Log in / Register）。
 *
 * 外壳（container / card / icon / title / desc）由本组件保留；
 * 登录入口三件套（Google 按钮 / OR / 两颗按钮）已收敛到 LoginModule，全站唯一实现。
 *
 * @param {object}  LANG          文案 map
 * @param {string?} redirectPath  登录成功后回跳路径；未传时由 LoginModule 内部取 window.location.href
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
