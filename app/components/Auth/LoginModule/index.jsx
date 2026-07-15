"use client";

import React from "react";
import Link from "next/link";
import GoogleLoginCustomButton from "@/components/Auth/GoogleAuth/GoogleLoginCustomButton";
import Button from "@/components/Button";
import styles from "./index.module.scss";

const T = (LANG, key, fallback) => LANG?.[key] || fallback;

/**
 * 全站统一「登录入口面板」——Google 快捷登录 + OR + Log in / Register 跳链。
 *
 * 三处共用：
 *  1. AuthRedirectGuard（售后 3 个页面的整页守卫卡片外壳内）
 *  2. 结账页 UserType 的 Sign-In tab 未登录面板
 *  3. Session 过期弹窗 LoginModal（复用同一入口，通过 showRegister/onActive 控制差异）
 *
 * @param {object}   LANG           文案 map
 * @param {string?}  redirectPath   登录成功后回跳路径；未传时挂载后取 window.location.href
 * @param {string?}  title          可选标题（不传不渲染）
 * @param {string?}  desc           可选副标题（不传不渲染）
 * @param {boolean?} showRegister   是否展示 Register 按钮，默认 true；session 过期场景传 false
 * @param {Function?} onActive      Login / Register 被点击时先触发（session 过期弹窗用它先关弹窗，再跳登录页）
 */
export default function LoginModule({
  LANG,
  redirectPath,
  title,
  desc,
  showRegister = true,
  onActive,
}) {
  const [selfUrl, setSelfUrl] = React.useState("");

  /* eslint-disable react-hooks/set-state-in-effect */
  React.useEffect(() => {
    if (redirectPath) {
      if (/^https?:\/\//i.test(redirectPath)) {
        setSelfUrl(redirectPath);
      } else {
        const origin = window.location.origin || "";
        setSelfUrl(
          `${origin}${redirectPath.startsWith("/") ? "" : "/"}${redirectPath}`
        );
      }
    } else {
      setSelfUrl(window.location.href);
    }
  }, [redirectPath]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const loginHref = `/user/login?redirect=${selfUrl}`;
  const registerHref = `/user/register?redirect=${selfUrl}`;

  const handleActive = React.useCallback(() => {
    if (typeof onActive === "function") onActive();
  }, [onActive]);

  return (
    <div className={styles.module} data-role="login-module">
      {title ? <h2 className={styles.title}>{title}</h2> : null}
      {desc ? (
        <p className={styles.desc}>
          {desc}
          <br />
          <span className={styles.agree}>
            <span>
              {T(LANG, "user_login.countinue_agree", "By continuing, you agree to our")}
            </span>
            <Link scroll={true} href="/article/legal/privacy-policy">
              {T(LANG, "user_login.privacy_policy", "Privacy Policy")}
            </Link>
            <span>{T(LANG, "user_login.and", "and")}</span>
            <Link scroll={true} href="/article/legal/user-agreement">
              {T(LANG, "user_login.user_service", "User Agreement")}
            </Link>
          </span>
        </p>
      ) : null}

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

      <div className={styles.divider}>
        <span className={styles.divider_line} />
        <span className={styles.divider_text}>
          {T(LANG, "user_account.login_guard.or", "OR")}
        </span>
        <span className={styles.divider_line} />
      </div>

      <div
        className={styles.entry_buttons}
        data-single={!showRegister ? "true" : "false"}
      >
        <Button
          variant="secondary"
          href={loginHref}
          className={styles.entry_button}
          onClick={handleActive}
        >
          {T(LANG, "user_account.login_guard.login", "Log in")}
        </Button>
        {showRegister ? (
          <Button
            variant="ghost"
            href={registerHref}
            className={styles.entry_button}
            onClick={handleActive}
          >
            {T(LANG, "user_account.login_guard.register", "Register")}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
