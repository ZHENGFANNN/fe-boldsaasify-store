"use client";

import styles from "../../../forget/page.module.scss";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";

import Api from "../../../api";

import React from "react";
import ShowTipModal from "../../../../../components/Modal/ShowTipModal";

export default function ResetForm({ LANG }) {
  const router = useRouter();
  // token 来自 URL query，挂载后从 window 读取，避免 useSearchParams 触发
  // 静态预渲染的 CSR bailout（需 Suspense 包裹），使本页可整页静态化。
  const [token, setToken] = React.useState(null);
  React.useEffect(() => {
    setToken(new URLSearchParams(location.search).get("token"));
  }, []);
  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm();
  const tipRef = React.useRef(null);
  const [loading, setLoading] = React.useState(false);

  const onSubmit = async (values) => {
    if (loading) return;
    if (!token) {
      tipRef.current.show({
        text:
          LANG["user_forget.token_invalid"] ||
          "Invalid or expired reset link. Please request a new one.",
        type: "error",
      });
      return;
    }
    setLoading(true);
    try {
      const res = await Api.resetPassword({
        token,
        new_password: values.new_password,
      });
      if (res.code !== 0) throw new Error("code !== 0");
      tipRef.current.show({
        text:
          LANG["user_forget.reset_success"] ||
          "Password reset successful. Please sign in.",
        type: "success",
      });
      reset();
      // 重置成功后直接跳转，去掉原 1200ms 延迟（消除跳转前的卡顿感）。
      router.push("/user/login");
    } catch {
      tipRef.current.show({
        text:
          LANG["user_forget.reset_failed"] ||
          "Reset link is invalid or expired. Please request a new one.",
        type: "error",
      });
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className={styles.form_item + " " + styles["mb-16"]}>
        <h2>{LANG["user_forget.new_password"] || "New password"}</h2>
        <input
          type="password"
          {...register("new_password", {
            required:
              LANG["user_forget.password_empyt"] || "Please enter a new password",
            minLength: {
              value: 8,
              message:
                LANG["user_forget.password_error"] ||
                "Password must be 8-20 characters",
            },
            maxLength: {
              value: 20,
              message:
                LANG["user_forget.password_error"] ||
                "Password must be 8-20 characters",
            },
          })}
          autoComplete="new-password"
        />
        <p>{errors.new_password?.message}</p>
      </div>

      <div className={styles.form_item + " " + styles["mb-16"]}>
        <h2>{LANG["user_forget.confirm_password"] || "Confirm password"}</h2>
        <input
          type="password"
          {...register("confirm_password", {
            required:
              LANG["user_forget.confirm_empyt"] || "Please confirm your password",
            validate: (v) =>
              v === watch("new_password") ||
              (LANG["user_forget.confirm_error"] || "Passwords do not match"),
          })}
          autoComplete="new-password"
        />
        <p>{errors.confirm_password?.message}</p>
      </div>

      <button type="submit" disabled={loading} className={styles.button}>
        {LANG["user_forget.reset_submit"] || "Reset password"}
      </button>
      <ShowTipModal ref={tipRef} />
    </form>
  );
}
