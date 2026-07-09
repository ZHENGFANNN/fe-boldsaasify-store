"use client";

import React from "react";
import styles from "./index.module.scss";
import GlobalContext from "@/[locale]/context";
import OrderContext from "../../context";
import Input from "../../../../components/Form/FormInput";
import { useForm } from "react-hook-form";
import Loading from "../../../../components/Loading";
import { isEmail } from "../../../../utils/pattern";
import Link from "next/link";
import Cookies from "js-cookie";
import Api from "../../api";
import GoogleLoginButton from "@/components/GoogleAuth/GoogleLoginButton";

function UserInfo({ LANG, token }, ref) {
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm();
  const formRef = React.useRef(null);
  const buttonRef = React.useRef(null);
  const { setUserType, userType, userInfo, userLoading, setCheckoutEmail } =
    React.useContext(OrderContext);

  const [touristsEmail, setTouristsEmail] = React.useState("");
  // 结账页内嵌 Google 登录：成功后原地回跳当前页刷新登录态（不去账户页）
  const [selfUrl, setSelfUrl] = React.useState("");
  React.useEffect(() => {
    setSelfUrl(location.href);
  }, []);

  React.useEffect(() => {
    if (userInfo?.email) {
      setValue("user_email", userInfo.email);
    } else {
      const tourists_email = localStorage.getItem("tourists_email");
      setTouristsEmail(tourists_email);
      setValue("tourists_email", tourists_email ?? "");
    }
  }, [userInfo]);

  React.useImperativeHandle(ref, () => ({
    onSubmit: () => {
      buttonRef.current?.click();
      const formData = new FormData(formRef.current);
      const formValues = Object.fromEntries(formData.entries());
      if (userType === "user" && userInfo?.email) {
        return { email: userInfo?.email };
      } else if (userType === "user" && !formValues.user_email) {
        return null;
      } else if (userType === "tourists" && formValues.tourists_email) {
        return { email: formValues.tourists_email };
      } else if (userType === "tourists" && !formValues.tourists_email) {
        return null;
      }
    },
  }));

  return (
    <form
      onSubmit={handleSubmit(() => {})}
      className={styles.container}
      ref={formRef}
    >
      <div
        className={`
            ${styles.tabs}
            ${
              userType === "user" ? styles.user_active : styles.tourists_active
            }`}
      >
        <div
          onClick={() => {
            setUserType("tourists");
          }}
          className={`${styles.tab_item} ${
            userType === "tourists" ? styles.active : ""
          }`}
        >
          {LANG["store.order.user_type.tourists_order"] || "Guest Checkout"}
        </div>
        <div
          onClick={() => {
            setUserType("user");
          }}
          className={`${styles.tab_item} ${
            userType === "user" ? styles.active : ""
          }`}
        >
          {LANG["store.order.user_type.user_order"] || "Sign In"}
        </div>
      </div>
      {userType === "tourists" ? (
        <div>
          <div className={styles.content}>
            <div className={styles.form_item}>
              <Input
                label={LANG["common.pay.pay_info.email"]}
                error={errors.tourists_email?.message}
                focus={touristsEmail}
                inputProps={{
                  ...register("tourists_email", {
                    required: LANG["store.order.user_type.email_empyt"],
                    pattern: {
                      value: isEmail,
                      message: LANG["common.pay.pay_info.email_error"],
                    },
                    // 上报到预览身份：预览请求带 email，与下单同口径过滤超限折扣
                    onBlur: (e) =>
                      setCheckoutEmail?.(e.target.value.trim()),
                  }),
                }}
              />
            </div>
          </div>
        </div>
      ) : null}
      {userType === "user" ? (
        <>
          {userLoading ? (
            <Loading height={100} />
          ) : (
            <>
              {userInfo?.email ? (
                <div>
                  <div className={styles.content}>
                    <div
                      className={`${styles.form_item} ${
                        userInfo?.email ? styles.disabled : ""
                      }`}
                    >
                      <Input
                        label={LANG["common.pay.pay_info.email"]}
                        error={errors.user_email?.message}
                        focus={userInfo?.email}
                        inputProps={{
                          disabled: userInfo?.email,
                          maxLength: 15,
                          ...register("user_email", {
                            required: LANG["store.order.user_type.email_empyt"],
                            pattern: {
                              value: isEmail,
                              message:
                                LANG["common.pay.pay_info.email_error"],
                            },
                          }),
                        }}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className={styles.content}>
                  <div className={styles.tip}>
                    {LANG["store.order.user_type.no_login"]}
                  </div>
                  <div className={styles.google_wrap}>
                    <GoogleLoginButton redirectTo={selfUrl} />
                  </div>
                  <div className={styles.or_row}>
                    {LANG["common.or"] || "or"}
                  </div>
                  <div className={styles.entry_links}>
                    <Link
                      scroll={true}
                      href={`/user/login?redirect=${selfUrl}`}
                      className={styles.entry_link}
                    >
                      {LANG["common.pay.pay_info.login"] || "Log in"}
                    </Link>
                    <span className={styles.entry_divider}>·</span>
                    <Link
                      scroll={true}
                      href={`/user/register?redirect=${selfUrl}`}
                      className={styles.entry_link}
                    >
                      {LANG["store.order.user_type.register"] || "Register"}
                    </Link>
                  </div>
                </div>
              )}
            </>
          )}
        </>
      ) : null}
      <button ref={buttonRef} hidden type="submit"></button>
    </form>
  );
}

export default React.forwardRef(UserInfo);
