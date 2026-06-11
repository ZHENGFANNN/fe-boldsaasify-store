"use client";

import React from "react";
import { useForm } from "react-hook-form";
import styles from "./index.module.scss";

import { ISPHONE, ISPHONEOBERVER } from "@/utils/pattern";

import FormInput from "@/components/Form/FormInput";
import FormCountryItem from "@/components/Form/FormCountryItem";
import { US_STATE_OPTIONS } from "@/config/usStates";

function AddressForm({ LANG, onStateChange }, ref) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm();
  const formRef = React.useRef();
  const buttonRef = React.useRef(null);
  const [areaMap, setAreaMap] = React.useState(null);
  const [addressForm, setAddressForm] = React.useState({});
  const stateValue = watch("state");

  React.useEffect(() => {
    onStateChange?.(stateValue || "");
  }, [stateValue, onStateChange]);

  React.useEffect(() => {
    try {
      const address_form = JSON.parse(localStorage.getItem("address_form"));
      setAddressForm(address_form ?? {});
      const filedList = [
        "address1",
        "address2",
        "first_name",
        "last_name",
        "phone",
        "short_phone",
        "zip_code",
        "state",
      ];
      Object.keys(address_form).forEach((item) => {
        if (filedList.includes(item)) {
          setValue(item, address_form[item]);
        }
      });
    } catch {}
  }, []);

  React.useImperativeHandle(ref, () => ({
    onSubmit: () => {
      buttonRef.current?.click();
      const formData = new FormData(formRef.current);
      const formValues = Object.fromEntries(formData.entries());
      const isCorrect = Object.keys(formValues).every((item) => {
        if (item === "address2") return true;
        if (item === "state" && areaMap?.area_code !== "us") return true;
        return formValues[item];
      });
      if (isCorrect) {
        return {
          ...areaMap,
          ...formValues,
          short_phone:
            areaMap?.area_code === "cn" ? "86" : formValues.short_phone,
        };
      } else {
        return null;
      }
    },
  }));

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit(() => {})}
      className={styles.form_container}
    >
      <div className={styles.form_item}>
        <FormCountryItem
          value={watch("area")}
          setValue={(e) => {
            setAreaMap(e);
            setValue("area", e.area_text);
          }}
          error={errors.area?.message}
          inputProps={{
            ...register("area", {
              required: LANG["user_account.shipping_address.area_required"],
            }),
          }}
        />
      </div>
      {areaMap?.area_code === "us" ? (
        <div className={styles.form_item}>
          <div className={styles.select_container}>
            <select
              className={styles.state_select}
              {...register("state", {
                required:
                  LANG["user_account.shipping_address.state_required"] ||
                  "Please select a state",
              })}
            >
              <option value="">
                {LANG["user_account.shipping_address.state"] || "State"}
              </option>
              {US_STATE_OPTIONS.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
            {errors.state?.message ? (
              <div className={styles.select_error}>{errors.state.message}</div>
            ) : null}
          </div>
        </div>
      ) : null}
      <div className={styles.form_group_1_1}>
        <div className={styles.form_item}>
          <FormInput
            label={LANG["user_account.shipping_address.first_name"]}
            error={errors.first_name?.message}
            focus={addressForm?.first_name}
            inputProps={{
              maxLength: 15,
              ...register("first_name", {
                required: LANG["user_account.shipping_address.first_name_require"],
              }),
            }}
          />
        </div>
        <div className={styles.form_item}>
          <FormInput
            label={LANG["user_account.shipping_address.last_name"]}
            error={errors.last_name?.message}
            focus={addressForm?.last_name}
            inputProps={{
              maxLength: 15,
              ...register("last_name", {
                required: LANG["user_account.shipping_address.last_name_require"],
              }),
            }}
          />
        </div>
      </div>
      <div className={styles.form_group_1_2}>
        {areaMap?.area_code === "cn" ? null : (
          <div className={`${styles.form_item} ${styles.form_item_1}`}>
            <FormInput
              error={errors.short_phone?.message}
              label={LANG["user_account.shipping_address.area_code"]}
              focus={addressForm.short_phone}
              inputProps={{
                maxLength: 5,
                ...register("short_phone", {
                  required: LANG["user_account.shipping_address.code_require"],
                  pattern: {
                    value: ISPHONEOBERVER,
                    message: LANG["common.pay.pay_info.incorrect_code"],
                  },
                }),
              }}
            />
          </div>
        )}
        <div className={`${styles.form_item} ${styles.form_item_2}`}>
          <FormInput
            error={errors.phone?.message}
            label={LANG["user_account.shipping_address.phone"]}
            focus={addressForm.phone}
            inputProps={{
              maxLength: 11,
              ...register("phone", {
                required: LANG["user_account.shipping_address.phone_require"],
                pattern: {
                  value: areaMap?.area_code === "cn" ? ISPHONE : ISPHONEOBERVER,
                  message: LANG["user_account.shipping_address.incorrect_phone"],
                },
              }),
            }}
          />
        </div>
      </div>
      <div className={styles.form_item}>
        <FormInput
          error={errors.zip_code?.message}
          label={LANG["user_account.shipping_address.zip_code"]}
          focus={addressForm.zip_code}
          inputProps={{
            maxLength: 20,
            ...register("zip_code", {
              required: LANG["user_account.shipping_address.zip_code_required"],
            }),
          }}
        />
      </div>
      <div className={styles.form_item}>
        <FormInput
          error={errors.address1?.message}
          label={LANG["user_account.shipping_address.address"]}
          focus={addressForm.address1}
          inputProps={{
            maxLength: 500,
            ...register("address1", {
              required: LANG["user_account.shipping_address.address_require"],
            }),
          }}
        />
      </div>
      <div className={styles.form_item}>
        <FormInput
          error={errors.address2?.message}
          required={false}
          label={LANG["common.pay.pay_info.detail_address"]}
          focus={addressForm.address2}
          inputProps={{
            maxLength: 500,
            ...register("address2"),
          }}
        />
      </div>
      <button type="submit" ref={buttonRef} hidden />
    </form>
  );
}

export default React.forwardRef(AddressForm);
