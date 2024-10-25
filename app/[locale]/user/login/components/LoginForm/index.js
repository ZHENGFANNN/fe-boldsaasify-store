/** @format */

"use client";

import React from "react";
import styles from "../../page.module.scss";
import GlobalContext from "../@/[locale]/context";
import Api from "../../../api";
import Cookies from "js-cookie";
import { useForm } from "react-hook-form";
import { isEmail } from "../../../../../utils/pattern";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import ShowTipModal from "../../../../../components/Modal/ShowTipModal";

export default function LoginForm({ LANG }) {
  const tipRef = React.useRef(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect");
  const [loading, setLoading] = React.useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm();
  const { setUserInfo } = React.useContext(GlobalContext);

  const [searchStr, setSearchStr] = React.useState();
  React.useEffect(() => {
    setSearchStr(location.search);
  }, []);

  React.useEffect(() => {
    const token = Cookies.get("token");
    if (token) {
      router.push("/user/account");
    }
  }, []);

  const onSubmit = React.useCallback(
    async (formData) => {
      setLoading(true);
      try {
        const data = await Api.userLogin(formData);
        if (data.code === 0) {
          setUserInfo({
            ...data.data,
            loading: false,
          });
          tipRef.current.show({
            text: LANG["www.user_login.login_success"],
            type: "success",
          });
          setTimeout(() => {
            if (redirect) {
              // TODO： 恶心操作 - url末尾自带 /
              const path = redirect.endsWith("/")
                ? redirect.slice(0, -1)
                : redirect;
              location.href = path;
            } else {
              location.href = "/user/account";
            }
          }, 500);
          reset();
        } else if (data.code === -1) {
          setLoading(false);
          tipRef.current.show({
            text: LANG["www.user_login.invalid_user"],
            type: "error",
          });
          reset();
        } else if (data.code === -2) {
          setLoading(false);
          tipRef.current.show({
            text: LANG["www.user_login.data_error"],
            type: "info",
          });
        } else {
          throw new Error("业务代码错误！");
        }
      } catch (err) {
        setLoading(false);
        tipRef.current.show({
          text: LANG["www.user_login.server_error"],
          type: "error",
        });
      }
    },
    [redirect]
  );

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className={styles.form_item + " " + styles["mb-16"]}>
          <h2>{LANG["www.user_login.email"]}</h2>
          <input
            {...register("email", {
              required: LANG["www.user_login.email_empyt"],
              pattern: {
                value: isEmail,
                message: LANG["www.user_login.email_error"],
              },
            })}
          />
          <p>{errors.email?.message}</p>
        </div>
        <div className={styles.form_item + " " + styles["mb-16"]}>
          <h2>{LANG["www.user_login.password"]}</h2>
          <input
            type="password"
            {...register("password", {
              required: LANG["www.user_login.password_empyt"],
              minLength: {
                value: 8,
                message: LANG["www.user_login.password_error"],
              },
              maxLength: {
                value: 20,
                message: LANG["www.user_login.password_error"],
              },
            })}
          />
          <p>{errors.password?.message}</p>
        </div>
        <span>
          <Link scroll={true} href={`/user/forget`} className={styles.forget}>
            {LANG["www.user_login.forget_password"]}
          </Link>
        </span>
        <button type="submit" disabled={loading} className={styles.button}>
          {LANG["www.user_login.login_title"]}
        </button>
        <ShowTipModal ref={tipRef} />
      </form>
      <p className={styles.register}>
        <span>{LANG["www.user_login.new_user"]}</span>
        <Link scroll={true} href={`/user/register${searchStr}`}>
          {LANG["www.user_login.create_acount"]}
        </Link>
      </p>
    </>
  );
}
