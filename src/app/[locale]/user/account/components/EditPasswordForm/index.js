"use client";

import React from "react";
import { useForm } from "react-hook-form";
import styles from "./index.module.scss";
import Input from "@/components/Form/Input";
import ShowTipModal from "@/components/Modal/ShowTipModal";
import Api from "../../api";
import GlobalContext from "@/globalContext";

export default function EditPasswordForm({ LANG }) {
  const [show, setShow] = React.useState(false);
  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm();
  const tipRef = React.useRef(null);

  React.useEffect(() => {
    if (show) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "scroll";
    }
  }, [show]);

  const [loading, setLoading] = React.useState(false);

  const onSubmit = React.useCallback(async (values) => {
    if (loading) return;
    setLoading(true);
    try {
      const res = await Api.editPassword(values);
      if (res.code === 0) {
        reset();
        tipRef.current.show({
          text: LANG["www.account.account_info.success_modified"],
          type: "success",
        });
        setShow(false);
      } else {
        throw new Error("code !== 0");
      }
    } catch (err) {
      reset();
      tipRef.current.show({
        text: LANG["www.account.account_info.fail_edits"],
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <div className={styles.container}>
      <div className={styles.main_btn}>
        <a onClick={() => setShow(true)}>
          {LANG["www.account.account_info.click_password"]}
        </a>
      </div>
      <div className={`${styles.modal} ${show ? styles.show : ""}`}>
        <div className={styles.modal_content}>
          <h2>{LANG["www.account.account_info.change_password"]}</h2>
          <form
            onSubmit={handleSubmit(onSubmit)}
            className={styles.form_container}
          >
            <div className={styles.form_item}>
              <Input
                label={LANG["www.account.account_info.old_password"]}
                error={errors.old_password?.message}
                inputProps={{
                  type: "password",
                  ...register("old_password", {
                    required:
                      LANG["www.account.account_info.old_password_require"],
                    minLength: {
                      value: 8,
                      message:
                        LANG["www.account.account_info.new_password_length"],
                    },
                    maxLength: {
                      value: 20,
                      message:
                        LANG["www.account.account_info.new_password_length"],
                    },
                  }),
                }}
              />
            </div>
            <div className={styles.form_item}>
              <Input
                label={LANG["www.account.account_info.new_password"]}
                error={errors.new_password?.message}
                inputProps={{
                  type: "password",
                  maxLength: 15,
                  ...register("new_password", {
                    required: LANG["www.account.account_info.new_password"],
                    minLength: {
                      value: 8,
                      message:
                        LANG["www.account.account_info.new_password_length"],
                    },
                    maxLength: {
                      value: 20,
                      message:
                        LANG["www.account.account_info.new_password_length"],
                    },
                  }),
                }}
              />
            </div>
            <div className={styles.form_item}>
              <Input
                label={LANG["www.account.account_info.confirm_passwrd"]}
                error={errors.confirm_password?.message}
                inputProps={{
                  type: "password",
                  maxLength: 15,
                  ...register("confirm_password", {
                    required:
                      LANG["www.account.account_info.confirm_password_require"],
                    validate: (value) => {
                      if (value === watch("new_password")) return true;
                      else
                        return LANG["www.account.account_info.confirm_error"];
                    },
                  }),
                }}
              />
            </div>
            <div className={styles.btn_container}>
              <div
                className={styles.btn_cancel}
                onClick={() => {
                  reset();
                  setShow(false);
                  document.body.style.overflow = "scroll";
                }}
              >
                {LANG["www.account.account_info.close"]}
              </div>
              <button
                type="submit"
                className={styles.btn_confirm}
                onClick={() => {
                  document.body.style.overflow = "scroll";
                }}
              >
                {LANG["www.account.account_info.confirm"]}
              </button>
            </div>
          </form>
        </div>
      </div>
      <ShowTipModal ref={tipRef} />
    </div>
  );
}
