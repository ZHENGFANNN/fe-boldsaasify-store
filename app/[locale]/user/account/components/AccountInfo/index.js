"use client";

import { useForm } from "react-hook-form";
import styles from "./index.module.scss";
import { isEmail } from "@/utils/pattern";
import React from "react";
import { useParams } from "next/navigation";
import Api from "../../api";
import GlobalContext from "@/[locale]/context";
import EditPasswordForm from "../EditPasswordForm/index";
import Loading from "@/components/Loading";
import Cookies from "js-cookie";
import verifyLogin from "@/utils/verifyLogin";

function FormInput({ inputProps, label, error }) {
  return (
    <div className={styles.form_item}>
      <h2>
        {label}
        <span>*</span>
      </h2>
      <input {...inputProps} />
      <p>{error}</p>
    </div>
  );
}

export default function AccountInfo({ showTip, LANG }) {
  const { locale } = useParams();
  const [loading, setLoading] = React.useState(true);
  const [userInfo, setUserInfo] = React.useState({});
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm();

  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);
    // 仅在服务端明确判定登录态失效（invalid）时才清 token 并弹回登录页；
    // 网络/超时（error）已在 verifyLogin 内重试，重试耗尽也保留 token，
    // 不再因一次抖动把已登录用户误踢到 /user/login。
    verifyLogin()
      .then((result) => {
        if (cancelled) return;
        if (result.status === "ok") {
          setUserInfo(result.data);
          reset(result.data);
        } else if (result.status === "invalid") {
          Cookies.remove("token");
          location.href = "/user/login";
        } else {
          console.log("[tokenLogin Error]: ", result.error);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const onSubmit = React.useCallback(
    async (values) => {
      if (
        JSON.stringify({
          nickname: values.nickname,
          last_name: values.last_name,
          first_name: values.first_name,
          email: values.email,
          phone: values.phone,
        }) ===
        JSON.stringify({
          nickname: userInfo.nickname,
          last_name: userInfo.last_name,
          first_name: userInfo.first_name,
          email: userInfo.email,
          phone: userInfo.phone,
        })
      ) {
        showTip({
          text: LANG["user_account.account_info.success_modified"],
          type: "success",
        });
        return;
      }

      try {
        const data = await Api.saveUserInfo(values);
        if (data.code === 0) {
          setUserInfo({
            nickname: values.nickname,
            last_name: values.last_name,
            first_name: values.first_name,
            email: values.email,
            phone: values.phone,
          });
          showTip({
            text: LANG["user_account.account_info.success_modified"],
            type: "success",
          });
        } else {
          throw new Error("code !== 0");
        }
      } catch {
        showTip({
          text: LANG["user_account.account_info.fail_edit"],
          type: "error",
        });
      }
    },
    [userInfo]
  );

  const formRef = React.useRef();

  return (
    <>
      {loading ? (
        <Loading height={400} />
      ) : (
        <div className={styles.all_container}>
          <form onSubmit={handleSubmit(onSubmit)} className={styles.container}>
            <div className={styles.title}>
              {LANG["user_account.account_info"]}
            </div>
            <div
              className={`${styles.form_group} ${
                locale === "zh-cn" ? "" : styles.flex_reverse
              }`}
            >
              <FormInput
                inputProps={{
                  ...register("first_name", {
                    required:
                      LANG["user_account.account_info.first_name_require"],
                    maxLength: {
                      value: 15,
                      message:
                        LANG["user_account.account_info.first_name_length"],
                    },
                  }),
                }}
                label={LANG["user_account.account_info.first_name"]}
                error={errors.first_name?.message}
              />
              <FormInput
                inputProps={{
                  ...register("last_name", {
                    required:
                      LANG["user_account.account_info.last_name_require"],
                    maxLength: {
                      value: 15,
                      message:
                        LANG["user_account.account_info.last_name_length"],
                    },
                  }),
                }}
                label={LANG["user_account.account_info.last_name"]}
                error={errors.last_name?.message}
              />
            </div>
            <FormInput
              inputProps={{
                ...register("nickname", {
                  required: LANG["user_account.account_info.nickname_require"],
                  maxLength: {
                    value: 15,
                    message: LANG["user_account.account_info.nickname_length"],
                  },
                }),
              }}
              label={LANG["user_account.account_info.nickname"]}
              error={errors.nickname?.message}
            />
            <FormInput
              inputProps={{
                ...register("email", {
                  required: LANG["user_account.account_info.email_require"],
                  pattern: {
                    value: isEmail,
                    message: LANG["user_account.account_info.email_incorrect"],
                  },
                }),
                disabled: true,
              }}
              label={LANG["user_account.account_info.email"]}
              error={errors.email?.message}
            />
            <FormInput
              inputProps={{
                maxLength: 20,
                ...register("phone", {
                  required: LANG["user_account.account_info.phone_required"],
                }),
              }}
              label={LANG["user_account.account_info.phone"]}
              error={errors.phone?.message}
            />
            <button ref={formRef} type="submit" hidden />
          </form>
          <div className={styles.password_container}>
            <div className={styles.title}>
              {LANG["user_account.account_info.password"]}
              <span>*</span>
            </div>
            <div>
              <EditPasswordForm LANG={LANG} showTip={(data) => showTip(data)} />
            </div>
          </div>
          <button
            onClick={() => {
              formRef.current?.click();
            }}
            className={styles.save_btn}
          >
            {LANG["user_account.account_info.save"]}
          </button>
          <button
            onClick={() => {
              Api.loginOut();
              Cookies.remove("token");
              location.href = "/";
            }}
            className={styles.exit_btn}
          >
            {LANG["user_account.account_info.login_out"]}
          </button>
        </div>
      )}
    </>
  );
}
