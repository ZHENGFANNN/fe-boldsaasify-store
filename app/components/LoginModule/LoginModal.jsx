"use client";

import React from "react";
import Modal from "@/components/Modal";
import LoginModule from "./index";
import styles from "./LoginModal.module.scss";

// 文案兜底：语言包暂未配置 user_login.session_expired.* 时用英文兜底
const T = (LANG, key, fallback) => LANG?.[key] || fallback;

/**
 * Session 过期弹窗 —— axios 收到 10014 后由 AuthGateProvider 弹起。
 *
 * 内嵌共享 <Modal>（portal 到 body + 遮罩 + close ×）+ 锁图标 + LoginModule。
 * 通过 forwardRef 暴露 show() / hide() 与父级 AuthGateContext 联动。
 */
function LoginModal({ LANG }, ref) {
  const modalRef = React.useRef(null);

  React.useImperativeHandle(ref, () => ({
    show: () => {
      // 传 title 让 Modal 内置 header + close × 生效
      modalRef.current?.show({
        title: T(LANG, "user_login.session_expired.title", "Session Expired"),
      });
    },
    hide: () => {
      modalRef.current?.hide();
    },
  }));

  return (
    <Modal ref={modalRef}>
      <div className={styles.body}>
        <div className={styles.icon} aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none">
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

        <LoginModule
          LANG={LANG}
          desc={T(
            LANG,
            "user_login.session_expired.desc",
            "Your session has expired. Please sign in again to continue."
          )}
        />
      </div>
    </Modal>
  );
}

export default React.forwardRef(LoginModal);
