"use client";

import React from "react";
import { useForm } from "react-hook-form";
import styles from "./index.module.scss";

// 单字段编辑弹窗：视觉沿用 EditPasswordForm 的 modal 骨架，只暴露一个 input。
// onConfirm(newValue) 由上层调用后端；本组件不感知任何业务 API。
export default function SingleFieldEditModal({
  open,
  title,
  label,
  defaultValue = "",
  maxLength = 50,
  required = true,
  requiredMessage,
  pattern,
  LANG,
  loading = false,
  onConfirm,
  onClose,
}) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({ defaultValues: { field: defaultValue } });

  React.useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      reset({ field: defaultValue });
    } else {
      document.body.style.overflow = "scroll";
    }
    return () => {
      document.body.style.overflow = "scroll";
    };
  }, [open, defaultValue, reset]);

  const submit = (values) => {
    if (loading) return;
    onConfirm?.(values.field?.trim() ?? "");
  };

  return (
    <div className={`${styles.modal} ${open ? styles.show : ""}`}>
      <div className={styles.modal_content}>
        <h2>{title}</h2>
        <form onSubmit={handleSubmit(submit)} className={styles.form_container}>
          <div className={styles.form_item}>
            <label>{label}</label>
            <input
              type="text"
              maxLength={maxLength}
              autoComplete="off"
              {...register("field", {
                required: required
                  ? requiredMessage || LANG["user_account.account_info.nickname_require"]
                  : false,
                pattern,
              })}
            />
            {errors.field?.message ? <p>{errors.field.message}</p> : null}
          </div>
          <div className={styles.btn_container}>
            <div
              className={styles.btn_cancel}
              onClick={() => {
                reset({ field: defaultValue });
                onClose?.();
              }}
            >
              {LANG["user_account.account_info.close"]}
            </div>
            <button type="submit" className={styles.btn_confirm}>
              {LANG["user_account.account_info.confirm"]}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
