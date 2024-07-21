"use client";
import { useForm } from "react-hook-form";
import Input from "@/components/Form/Input";
import styles from "./index.module.scss";
import React from "react";

function CreditForm(_, ref) {
  const formRef = React.useRef();
  const {
    LANG,
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();
  const buttonRef = React.useRef(null);
  React.useImperativeHandle(ref, () => {
    return {
      onSubmit: () => {
        buttonRef.current.click();
        const formData = new FormData(formRef.current);
        const formValues = Object.fromEntries(formData.entries());
        const isCorrect = Object.keys(formValues).every((item) => {
          return formValues[item];
        });
        if (isCorrect) {
          return formValues;
        } else {
          return null;
        }
      },
    };
  });
  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit(() => {})}
      className={styles.from_container}
    >
      <Input
        label={LANG["store.order.credit_info.credit_number"]}
        error={errors.card_number?.message}
        inputProps={{
          maxLength: 40,
          ...register("card_number", {
            required: LANG["store.order.credit_info.creadit_number_required"],
          }),
        }}
      />
      <Input
        label={LANG["store.order.credit_info.month"]}
        error={errors.card_month?.message}
        inputProps={{
          maxLength: 2,
          ...register("card_month", {
            required: LANG["store.order.credit_info.month_required"],
          }),
        }}
      />
      <Input
        error={errors.card_year?.message}
        label={LANG["store.order.credit_info.year"]}
        inputProps={{
          ...register("card_year", {
            required: LANG["store.order.credit_info.year_required"],
          }),
          maxLength: 5,
        }}
      />
      <Input
        error={errors.card_cvv?.message}
        label={LANG["store.order.credit_info.cvv"]}
        inputProps={{
          ...register("card_cvv", {
            maxLength: 6,
            required: LANG["store.order.credit_info.cvv_required"],
          }),
        }}
      />
      <Input
        error={errors.card_name?.message}
        label={LANG["store.order.credit_info.name"]}
        inputProps={{
          maxLength: 50,
          ...register("card_name", {
            required: LANG["store.order.credit_info.name_required"],
          }),
        }}
      />
      <button ref={buttonRef} hidden type="submit"></button>
    </form>
  );
}

export default React.forwardRef(CreditForm);
