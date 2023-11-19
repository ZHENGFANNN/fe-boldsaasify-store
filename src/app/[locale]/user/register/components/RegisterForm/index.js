"use client";

import React from "react";
import styles from "../../page.module.scss";
import Api from "../../../api";
import Cookies from "js-cookie";
import { useForm } from "react-hook-form";
import { ISEMAIL } from "@/utils/pattern";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import ShowTipModal from "@/components/Modal/ShowTipModal";

export default function RegisterForm({ LANG }) {
  const [loading, setLoading] = React.useState(false);
  const router = useRouter();
  const { locale } = useParams();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect");

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm();
  const tipRef = React.useRef(null);
  const onSubmit = async function (data) {
    try {
      setLoading(true);
      const res = await Api.userRegister({
        ...data,
        language: locale,
        area: Cookies.get("area") || "",
      });
      if (res.code === 0) {
        tipRef.current.show({
          text: LANG["www.user_register.register_success"],
          type: "success",
        });
        reset();
        setTimeout(() => {
          if (redirect) {
            // TODO： 恶心操作 - url末尾自带 /
            const path = redirect.endsWith("/")
              ? redirect.slice(0, -1)
              : redirect;
            location.href = path;
          } else {
            router.push("/user/login");
          }
        }, 500);
      } else if (res.code === -1) {
        setLoading(false);
        tipRef.current.show({
          text: LANG["www.user_register.comfrom_password_error"],
          type: "error",
        });
        reset();
      } else if (res.code === -2) {
        setLoading(false);

        tipRef.current.show({
          text: LANG["www.user_register.email_registered"],
          type: "info",
        });
        reset();
      } else {
        throw new Error("code !== 0");
      }
    } catch {
      setLoading(false);

      tipRef.current.show({
        text: LANG["www.user_register.tip_service_exception"],
        type: "error",
      });
    }
  };

  const { password } = watch();
  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className={styles.form_item + " " + styles["mb-16"]}>
        <h2>{LANG["www.user_register.nickname"]}</h2>
        <input
          {...register("nickname", {
            required: LANG["www.user_register.nickname_empyt"],
            minLength: {
              value: 2,
              message: LANG["www.user_register.nickname_error"],
            },
            maxLength: {
              value: 15,
              message: LANG["www.user_register.nickname_error"],
            },
          })}
          autoComplete="off"
        />
        <p>{errors.nickname?.message}</p>
      </div>
      <div className={styles.form_item + " " + styles["mb-16"]}>
        <h2>{LANG["www.user_register.email"]}</h2>
        <input
          {...register("email", {
            required: LANG["www.user_register.email_empyt"],
            pattern: {
              value: ISEMAIL,
              message: LANG["www.user_register.email_format"],
            },
          })}
          autoComplete="off"
        />
        <p>{errors.email?.message}</p>
      </div>
      <div className={styles.form_item + " " + styles["mb-16"]}>
        <h2>{LANG["www.user_register.password"]}</h2>
        <input
          type="password"
          {...register("password", {
            required: LANG["www.user_register.password_empyt"],
            minLength: {
              value: 8,
              message: LANG["www.user_register.password_format"],
            },
            maxLength: {
              value: 20,
              message: LANG["www.user_register.password_format"],
            },
          })}
        />
        <p>{errors.password?.message}</p>
      </div>
      <div className={styles.form_item}>
        <h2>{LANG["www.user_register.again_password"]}</h2>
        <input
          type="password"
          {...register("confirm_password", {
            required: LANG["www.user_register.again_password_empyt"],
            validate: (value) => {
              if (value === password) return true;
              else return LANG["www.user_register.comfrom_password_error"];
            },
          })}
        />
        <p>{errors.confirm_password?.message}</p>
      </div>
      <button disabled={loading} type="submit" className={styles.button}>
        {LANG["www.user_register.submit"]}
      </button>
      <ShowTipModal ref={tipRef} />
    </form>
  );
}
