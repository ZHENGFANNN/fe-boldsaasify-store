"use client";

import React from "react";
import Modal from "@/components/Modal";
import LoginModule from "../LoginModule";
import styles from "./index.module.scss";

const T = (LANG, key, fallback) => LANG?.[key] || fallback;

/**
 * Session 过期弹窗 —— axios 收到 10014 后由 AuthGateProvider 弹起。
 *
 * 使用约束：
 *  - 不可关闭：Modal 传 closable={false}（禁遮罩点击 + 隐藏 close ×，且不渲染 title 避免出现顶部条）；
 *  - 隐藏 Register：用户已注册过才会 session 过期，Register 冗余；
 *  - onActive：点击 Log in 前先 hide 弹窗，避免跳登录页后弹窗仍残留一帧遮罩。
 *
 * 通过 forwardRef 暴露 show() / hide() 与父级 AuthGateContext 联动。
 */
function LoginModal({ LANG }, ref) {
  const modalRef = React.useRef(null);

  React.useImperativeHandle(ref, () => ({
    show: () => {
      modalRef.current?.show();
    },
    hide: () => {
      modalRef.current?.hide();
    },
  }));

  const handleActive = React.useCallback(() => {
    modalRef.current?.hide();
  }, []);

  return (
    <Modal ref={modalRef} closable={false}>
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
          title={T(LANG, "user_login.session_expired.title", "Session Expired")}
          desc={T(
            LANG,
            "user_login.session_expired.desc",
            "Your session has expired. Please sign in again to continue."
          )}
          showRegister={false}
          onActive={handleActive}
        />
      </div>
    </Modal>
  );
}

export default React.forwardRef(LoginModal);
