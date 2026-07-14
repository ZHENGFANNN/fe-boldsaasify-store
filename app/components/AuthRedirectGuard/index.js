"use client";

import React from "react";
import GoogleLoginCustomButton from "@/components/GoogleAuth/GoogleLoginCustomButton";
import Button from "@/components/Button";
import styles from "./index.module.scss";

// 文案兜底：语言包暂未配置 user_account.login_guard.* 时用英文兜底
const T = (LANG, key, fallback) => LANG?.[key] || fallback;

/**
 * 未登录守卫卡片：展示锁图标 + 主副标题 + Google 快捷登录 + OR 分隔 + Login / Register 邮箱入口。
 * 视觉与结账页 UserType 的「未登录」状态对齐；按钮统一走公共 <Button />。
 *
 * @param {object}  LANG          文案 map
 * @param {string?} redirectPath  登录成功后回跳路径；未传时挂载后取 window.location.pathname+search
 */
export default function AuthRedirectGuard({ LANG, redirectPath }) {
  const [selfUrl, setSelfUrl] = React.useState("");

  // window 仅挂载后可读（SSR 无 window），据当前路径/URL 拼登录回跳地址。
  /* eslint-disable react-hooks/set-state-in-effect */
  React.useEffect(() => {
    if (redirectPath) {
      // 显式传路径时，拼绝对 URL（Google OAuth 回跳需要绝对地址）
      const origin = window.location.origin || "";
      setSelfUrl(
        `${origin}${redirectPath.startsWith("/") ? "" : "/"}${redirectPath}`
      );
    } else {
      setSelfUrl(window.location.href);
    }
  }, [redirectPath]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const loginHref = `/user/login?redirect=${selfUrl}`;
  const registerHref = `/user/register?redirect=${selfUrl}`;

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
          {T(
            LANG,
            "user_account.login_guard.title",
            "Sign in required"
          )}
        </h2>

        <p className={styles.desc}>
          {T(
            LANG,
            "user_account.login_guard.desc",
            "You need to sign in to use this feature. Please sign in to continue."
          )}
        </p>

        {/* Google 快捷登录（主入口） */}
        <div className={styles.google_wrap}>
          <GoogleLoginCustomButton
            redirectTo={selfUrl}
            label={T(
              LANG,
              "user_account.login_guard.google_continue",
              "Continue with Google"
            )}
          />
        </div>

        {/* OR 分隔线 */}
        <div className={styles.divider}>
          <span className={styles.divider_line} />
          <span className={styles.divider_text}>
            {T(LANG, "user_account.login_guard.or", "OR")}
          </span>
          <span className={styles.divider_line} />
        </div>

        {/* 邮箱登录 / 注册（次要入口，一行两颗） */}
        <div className={styles.entry_buttons}>
          <Button
            variant="secondary"
            href={loginHref}
            className={styles.entry_button}
          >
            {T(LANG, "user_account.login_guard.login", "Log in")}
          </Button>
          <Button
            variant="ghost"
            href={registerHref}
            className={styles.entry_button}
          >
            {T(LANG, "user_account.login_guard.register", "Register")}
          </Button>
        </div>
      </div>
    </div>
  );
}
