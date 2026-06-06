"use client";

import styles from "../../page.module.scss";
import { useForm } from "react-hook-form";
import { isEmail } from "../../../../../utils/pattern";

import Api from "../../../api";

import React from "react";
import ShowTipModal from "../../../../../components/Modal/ShowTipModal";

export default function ForgetForm({ LANG }) {
  // mode: "self" 自助邮件重置（发重置链接）| "manual" 提交人工找回申请（ERP 工单）
  const [mode, setMode] = React.useState("self");
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm();
  const tipRef = React.useRef(null);

  const switchMode = (next) => {
    if (next === mode) return;
    setMode(next);
    reset();
  };

  const onSubmit = async function (data) {
    try {
      if (mode === "self") {
        // 自助：仅提交邮箱，后端校验后发送重置链接
        const res = await Api.verifyForgetPassword({ email: data.email });
        if (res.code !== 0) throw new Error("code !== 0");
        tipRef.current.show({
          text:
            LANG["user_forget.reset_link_sent"] ||
            "If this email is registered, a password reset link has been sent. Please check your inbox.",
          type: "success",
        });
        reset();
      } else {
        // 人工：提交邮箱 + 联系方式，落库为 ERP 工单
        const res = await Api.forgetPassword(data);
        if (res.code !== 0) throw new Error("code !== 0");
        tipRef.current.show({
          text: LANG["user_forget.submit_success"],
          type: "success",
        });
        reset();
      }
    } catch {
      tipRef.current.show({
        text: LANG["user_forget.tip_service_exception"],
        type: "error",
      });
    }
  };

  const tabBtn = (m, label) => (
    <button
      type="button"
      onClick={() => switchMode(m)}
      style={{
        flex: 1,
        padding: "8px 0",
        cursor: "pointer",
        border: "none",
        borderBottom: mode === m ? "2px solid #333" : "2px solid #e5e5e5",
        background: "transparent",
        fontWeight: mode === m ? 700 : 400,
      }}
    >
      {label}
    </button>
  );

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {tabBtn("self", LANG["user_forget.mode_self"] || "Reset via email")}
        {tabBtn("manual", LANG["user_forget.mode_manual"] || "Contact support")}
      </div>

      <div className={styles.form_item + " " + styles["mb-16"]}>
        <h2>{LANG["user_forget.email"]}</h2>
        <input
          {...register("email", {
            required: LANG["user_forget.email_empyt"],
            pattern: {
              value: isEmail,
              message: LANG["user_forget.email_format"],
            },
          })}
          autoComplete="off"
        />
        <p>{errors.email?.message}</p>
      </div>

      {mode === "manual" ? (
        <div className={styles.form_item + " " + styles["mb-16"]}>
          <h2>{LANG["user_forget.connect_way"]}</h2>
          <input
            {...register("connect_way", {
              required: LANG["user_forget.connect_empyt"],
              minLength: {
                value: 1,
                message: LANG["user_forget.connect_error"],
              },
              maxLength: {
                value: 100,
                message: LANG["user_forget.connect_error"],
              },
            })}
            autoComplete="off"
          />
          <p>{errors.connect_way?.message}</p>
        </div>
      ) : null}

      <div className={styles.tip}>
        {mode === "self"
          ? LANG["user_forget.reset_tip"] ||
            "Enter your account email and we'll send you a link to reset your password."
          : LANG["user_forget.forget_tip"]}
      </div>
      <button type="submit" className={styles.button}>
        {mode === "self"
          ? LANG["user_forget.send_reset_link"] || "Send reset link"
          : LANG["user_forget.submit"]}
      </button>
      <ShowTipModal ref={tipRef} />
    </form>
  );
}
