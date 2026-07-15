"use client";

import React from "react";
import styles from "./GoogleLoginPanel.module.scss";
import GoogleLoginCustomButton from "./GoogleLoginCustomButton";
import ShowTipModal from "@/components/Modal/ShowTipModal";

const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

/**
 * 登录/注册页的「使用 Google 登录」面板：分隔线 + 自定义 Google 按钮 + 结果提示。
 * 两页通用，按钮宽度 100% 撑满容器，视觉与订单页 UserType 保持一致。
 *
 * @param {string} label            分隔线文案（如「或」），空则不渲染分隔线
 * @param {string} buttonLabel      按钮上的文案，默认 "Continue with Google"
 * @param {string} successText      登录成功提示文案
 * @param {string} errorText        登录失败提示文案
 * @param {string} className        自定义样式类
 * @param {"top"|"bottom"} dividerPosition  分隔线位置，默认 "top"（按钮上方）
 */
export default function GoogleLoginPanel({
  label,
  buttonLabel,
  successText,
  errorText,
  className,
  dividerPosition = "top",
}) {
  const tipRef = React.useRef(null);

  if (!CLIENT_ID) return null;

  const divider = label ? (
    <div className={styles.divider}>
      <div className={styles.line} />
      <div className={styles.text}>{label}</div>
      <div className={styles.line} />
    </div>
  ) : null;

  return (
    <div className={`${styles.panel} ${className || ""}`}>
      {dividerPosition === "top" ? divider : null}
      <div className={styles.button_wrap}>
        <GoogleLoginCustomButton
          label={buttonLabel}
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
      {dividerPosition === "bottom" ? divider : null}
      <ShowTipModal ref={tipRef} />
    </div>
  );
}
