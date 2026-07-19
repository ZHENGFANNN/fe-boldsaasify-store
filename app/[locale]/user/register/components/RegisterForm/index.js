"use client";

import React from "react";
import styles from "../../page.module.scss";
import Api from "../../../api";
import Cookies from "js-cookie";
import { useForm } from "react-hook-form";
import { isEmail } from "../../../../../utils/pattern";
import { useRouter, useParams } from "next/navigation";
import ShowTipModal from "../../../../../components/Modal/ShowTipModal";

export default function RegisterForm({ LANG }) {
  const [loading, setLoading] = React.useState(false);
  // 发码在途 / 冷却倒计时（秒）：与后端 60s 发送冷却对齐，倒计时期间禁用发码按钮。
  const [sending, setSending] = React.useState(false);
  const [countdown, setCountdown] = React.useState(0);
  const router = useRouter();
  const { locale } = useParams();
  // redirect 来自 URL query，挂载后从 window 读取，避免 useSearchParams 触发
  // 静态预渲染的 CSR bailout（需 Suspense 包裹），使本页可整页静态化。
  const [redirect, setRedirect] = React.useState(null);
  React.useEffect(() => {
    setRedirect(new URLSearchParams(location.search).get("redirect"));
  }, []);

  // 倒计时递减。
  React.useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const {
    register,
    handleSubmit,
    reset,
    getValues,
    formState: { errors },
  } = useForm();
  const tipRef = React.useRef(null);

  // 按后端错误码映射提示文案（storefront 以英文为主，LANG 有对应 key 时优先取）。
  const errText = (res) => {
    switch (res?.code) {
      case 10002:
        return LANG["user_register.email_registered"];
      case 10070:
        return (
          LANG["user_register.code_cooldown"] ||
          "Please wait a moment before requesting another code"
        );
      case 10071:
      case 10072:
        return (
          LANG["user_register.code_send_fail"] ||
          "Failed to send the verification code, please try again later"
        );
      case 10073:
        return (
          LANG["user_register.code_invalid"] ||
          "The verification code is invalid or has expired"
        );
      case 10074:
        return (
          LANG["user_register.code_incorrect"] || "Incorrect verification code"
        );
      default:
        return res?.message || LANG["user_register.tip_service_exception"];
    }
  };

  // 发送邮箱验证码：先校验邮箱格式 → 调后端发码 → 成功则起 60s 倒计时。
  const handleSendCode = async () => {
    if (sending || countdown > 0) return;
    const email = (getValues("email") || "").trim();
    if (!email || !isEmail.test(email)) {
      tipRef.current.show({
        text: LANG["user_register.email_format"],
        type: "error",
      });
      return;
    }
    try {
      setSending(true);
      const res = await Api.sendRegisterCode({ email, language: locale });
      if (res.code === 0) {
        setCountdown(60);
        tipRef.current.show({
          text:
            LANG["user_register.code_sent"] ||
            "Verification code sent to your email",
          type: "success",
        });
      } else {
        tipRef.current.show({
          text: errText(res),
          type: res.code === 10002 ? "info" : "error",
        });
      }
    } catch {
      tipRef.current.show({
        text: LANG["user_register.tip_service_exception"],
        type: "error",
      });
    } finally {
      setSending(false);
    }
  };

  const onSubmit = async function (data) {
    try {
      setLoading(true);
      // 昵称不再收集：后端为空时自动生成 user_xxxxxx。
      const res = await Api.userRegister({
        ...data,
        language: locale,
        area: Cookies.get("area") || "",
      });
      if (res.code === 0) {
        tipRef.current.show({
          text: LANG["user_register.register_success"],
          type: "success",
        });
        reset();
        setCountdown(0);
        // 注册成功后直接跳转，去掉原 500ms 延迟（消除跳转前的卡顿感）。
        if (redirect) {
          // TODO： 恶心操作 - url末尾自带 /
          const path = redirect.endsWith("/")
            ? redirect.slice(0, -1)
            : redirect;
          location.href = path;
        } else {
          router.push("/user/login");
        }
      } else {
        setLoading(false);
        tipRef.current.show({
          text: errText(res),
          type: res.code === 10002 ? "info" : "error",
        });
      }
    } catch {
      setLoading(false);

      tipRef.current.show({
        text: LANG["user_register.tip_service_exception"],
        type: "error",
      });
    }
  };

  const codeBtnLabel =
    countdown > 0
      ? `${countdown}s`
      : sending
      ? LANG["user_register.code_sending"] || "Sending…"
      : LANG["user_register.send_code"] || "Send code";

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className={styles.form_item + " " + styles["mb-16"]}>
        <h2>{LANG["user_register.email"]}</h2>
        <input
          {...register("email", {
            required: LANG["user_register.email_empyt"],
            pattern: {
              value: isEmail,
              message: LANG["user_register.email_format"],
            },
          })}
          autoComplete="off"
        />
        <p>{errors.email?.message}</p>
      </div>
      <div className={styles.form_item + " " + styles["mb-16"]}>
        <h2>{LANG["user_register.password"]}</h2>
        <input
          type="password"
          {...register("password", {
            required: LANG["user_register.password_empyt"],
            minLength: {
              value: 8,
              message: LANG["user_register.password_format"],
            },
            maxLength: {
              value: 20,
              message: LANG["user_register.password_format"],
            },
          })}
        />
        <p>{errors.password?.message}</p>
      </div>
      <div className={styles.form_item}>
        <h2>{LANG["user_register.code"] || "Verification code"}</h2>
        <div className={styles.code_row}>
          <input
            {...register("code", {
              required:
                LANG["user_register.code_empty"] ||
                "Please enter the verification code",
            })}
            autoComplete="off"
            inputMode="numeric"
          />
          <button
            type="button"
            className={
              styles.send_code_btn +
              (countdown > 0 || sending ? " " + styles.is_disabled : "")
            }
            disabled={sending || countdown > 0}
            onClick={handleSendCode}
          >
            {codeBtnLabel}
          </button>
        </div>
        <p>{errors.code?.message}</p>
      </div>
      <button disabled={loading} type="submit" className={styles.button}>
        {LANG["user_register.submit"]}
      </button>
      <ShowTipModal ref={tipRef} />
    </form>
  );
}
