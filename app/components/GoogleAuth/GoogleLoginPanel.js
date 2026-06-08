"use client";

import React from "react";
import styles from "./GoogleLoginPanel.module.scss";
import GoogleLoginButton from "./GoogleLoginButton";
import ShowTipModal from "@/components/Modal/ShowTipModal";

const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

/**
 * 登录/注册页的「使用 Google 登录」面板：分隔线 + Google 官方按钮 + 结果提示。
 * 两页通用，自带样式，登录态切换/跳转由 GoogleLoginButton 负责。
 *
 * @param {string} label        分隔线文案（如「或」），空则不渲染分隔线
 * @param {string} successText  登录成功提示文案
 * @param {string} errorText    登录失败提示文案
 */
export default function GoogleLoginPanel({ label, successText, errorText }) {
  const tipRef = React.useRef(null);

  if (!CLIENT_ID) return null;

  return (
    <div className={styles.panel}>
      {label ? (
        <div className={styles.divider}>
          <div className={styles.line} />
          <div className={styles.text}>{label}</div>
          <div className={styles.line} />
        </div>
      ) : null}
      <div className={styles.button_wrap}>
        <GoogleLoginButton
          onSuccess={() =>
            successText &&
            tipRef.current?.show({ text: successText, type: "success" })
          }
          onError={() =>
            errorText &&
            tipRef.current?.show({ text: errorText, type: "error" })
          }
        />
      </div>
      <ShowTipModal ref={tipRef} />
    </div>
  );
}
