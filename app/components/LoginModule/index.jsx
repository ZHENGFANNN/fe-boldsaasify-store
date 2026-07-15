"use client";

import React from "react";
import GoogleLoginCustomButton from "@/components/GoogleAuth/GoogleLoginCustomButton";
import Button from "@/components/Button";
import styles from "./index.module.scss";

// 文案兜底：语言包暂未配置 user_account.login_guard.* 时用英文兜底
const T = (LANG, key, fallback) => LANG?.[key] || fallback;

/**
 * 全站统一「登录入口面板」——Google 快捷登录 + OR + Log in / Register 跳链。
 *
 * 三处共用：
 *  1. AuthRedirectGuard（售后 3 个页面的整页守卫卡片外壳内）
 *  2. 结账页 UserType 的 Sign-In tab 未登录面板
 *  3. Session 过期弹窗 LoginModal
 *
 * 设计约束：
 *  - 纯 UI 组件；不含任何邮箱表单（表单仍在 /user/login 页）。
 *  - Log in / Register 是链接（<Button href>），跳 /user/login?redirect=<url> 与 /user/register?redirect=<url>。
 *  - Google 按钮内嵌用 <GoogleLoginCustomButton>，redirectTo 传 selfUrl，登录成功后原地回跳。
 *  - title / desc 可选：传了就渲染标题/副标题（Modal 场景），不传就只渲染登录入口区域（UserType 内嵌，
 *    外部已经有 tip 文案 / 卡片壳）。
 *
 * @param {object}  LANG          文案 map
 * @param {string?} redirectPath  登录成功后回跳路径；未传时挂载后取 window.location.href
 * @param {string?} title         可选标题（不传不渲染）
 * @param {string?} desc          可选副标题（不传不渲染）
 */
export default function LoginModule({ LANG, redirectPath, title, desc }) {
  const [selfUrl, setSelfUrl] = React.useState("");

  // window 仅挂载后可读（SSR 无 window），据当前路径/URL 拼登录回跳地址。
  /* eslint-disable react-hooks/set-state-in-effect */
  React.useEffect(() => {
    if (redirectPath) {
      // 若已是绝对 URL 直接用；否则拼 origin
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

  return (
    <div className={styles.module} data-role="login-module">
      {title ? <h2 className={styles.title}>{title}</h2> : null}
      {desc ? <p className={styles.desc}>{desc}</p> : null}

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
  );
}
