"use client";

import React from "react";
import styles from "./index.module.scss";
import GlobalContext from "@/GlobalContext";
import OrderContext from "../../context";
import Input from "@/components/Form/Input";
import { useForm } from "react-hook-form";
import Loading from "@/components/Loading";
import { isEmail } from "@/utils/pattern";
import Link from "next/link";

function UserInfo({ LANG, token }, ref) {
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm();
  const formRef = React.useRef(null);
  const buttonRef = React.useRef(null);
  const { userInfo } = React.useContext(GlobalContext);
  const { setUserType, userType } = React.useContext(OrderContext);
  const [touristsEmail, setTouristsEmail] = React.useState("");

  React.useEffect(() => {
    setValue("user_email", userInfo?.email ?? "");
    const tourists_email = localStorage.getItem("tourists_email");
    setTouristsEmail(tourists_email);
    setValue("tourists_email", tourists_email ?? "");
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
          {LANG["store.order.user_type.tourists_order"]}
        </div>
        <div
          onClick={() => {
            setUserType("user");
          }}
          className={`${styles.tab_item} ${
            userType === "user" ? styles.active : ""
          }`}
        >
          {LANG["store.order.user_type.user_order"]}
        </div>
      </div>
      {userType === "tourists" ? (
        <div>
          <div className={styles.content}>
            <div className={styles.form_item}>
              <Input
                label={LANG["store.order.user_type.email"]}
                error={errors.tourists_email?.message}
                focus={touristsEmail}
                inputProps={{
                  ...register("tourists_email", {
                    required: LANG["store.order.user_type.email_empyt"],
                    pattern: {
                      value: isEmail,
                      message: LANG["store.order.user_type.email_error"],
                    },
                  }),
                }}
              />
            </div>
          </div>
        </div>
      ) : null}
      {userType === "user" ? (
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
                    label={LANG["store.order.user_type.email"]}
                    error={errors.user_email?.message}
                    focus={userInfo?.email}
                    inputProps={{
                      disabled: userInfo?.email,
                      maxLength: 15,
                      ...register("user_email", {
                        required: LANG["store.order.user_type.email_empyt"],
                        pattern: {
                          value: isEmail,
                          message: LANG["store.order.user_type.email_error"],
                        },
                      }),
                    }}
                  />
                </div>
              </div>
            </div>
          ) : (
            <>
              {token ? (
                <Loading height={100} />
              ) : (
                <div className={styles.content}>
                  <div className={styles.tip}>
                    {LANG["store.order.user_type.no_login"]}
                  </div>
                  <div className={styles.btn_container}>
                    <Link
                      href={`/user/login?redirect=${location.href}`}
                      className={styles.btn_item}
                    >
                      {LANG["store.order.user_type.login"]}
                    </Link>
                    <Link
                      href={`/user/register?redirect=${location.href}`}
                      className={styles.btn_item}
                    >
                      {LANG["store.order.user_type.register"]}
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
