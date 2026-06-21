"use client";

import styles from "../../page.module.scss";
import { useForm } from "react-hook-form";
import { isEmail } from "../../../../../utils/pattern";

import Api from "../../../api";

import React from "react";
import ShowTipModal from "../../../../../components/Modal/ShowTipModal";

export default function ForgetForm({ LANG }) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm();
  const tipRef = React.useRef(null);

  const onSubmit = async function (data) {
    try {
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
    } catch {
      tipRef.current.show({
        text: LANG["user_forget.tip_service_exception"],
        type: "error",
      });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
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

      <div className={styles.tip}>
        {LANG["user_forget.reset_tip"] ||
          "Enter your account email and we'll send you a link to reset your password."}
      </div>
      <button type="submit" className={styles.button}>
        {LANG["user_forget.send_reset_link"] || "Send reset link"}
      </button>
      <ShowTipModal ref={tipRef} />
    </form>
  );
}
