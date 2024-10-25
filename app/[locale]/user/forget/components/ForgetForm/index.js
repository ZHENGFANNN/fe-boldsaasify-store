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
      const res = await Api.forgetPassword(data);
      if (res.code === 0) {
        tipRef.current.show({
          text: LANG["www.forget.submit_success"],
          type: "success",
        });
        reset();
      } else {
        throw new Error("code !== 0");
      }
    } catch {
      tipRef.current.show({
        text: LANG["www.forget.tip_service_exception"],
        type: "error",
      });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className={styles.form_item + " " + styles["mb-16"]}>
        <h2>{LANG["www.forget.email"]}</h2>
        <input
          {...register("email", {
            required: LANG["www.forget.email_empyt"],
            pattern: {
              value: isEmail,
              message: LANG["www.forget.email_format"],
            },
          })}
          autoComplete="off"
        />
        <p>{errors.email?.message}</p>
      </div>
      <div className={styles.form_item + " " + styles["mb-16"]}>
        <h2>{LANG["www.forget.connect_way"]}</h2>
        <input
          {...register("connect_way", {
            required: LANG["www.forget.connect_empyt"],
            minLength: {
              value: 1,
              message: LANG["www.forget.connect_error"],
            },
            maxLength: {
              value: 100,
              message: LANG["www.forget.connect_error"],
            },
          })}
          autoComplete="off"
        />
        <p>{errors.connect_way?.message}</p>
      </div>
      <div className={styles.tip}>{LANG["www.forget.forget_tip"]}</div>
      <button type="submit" className={styles.button}>
        {LANG["www.forget.submit"]}
      </button>
      <ShowTipModal ref={tipRef} />
    </form>
  );
}
