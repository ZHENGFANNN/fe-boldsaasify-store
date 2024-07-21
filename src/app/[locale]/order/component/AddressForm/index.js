"use client";

import { useForm } from "react-hook-form";
import Input from "@/components/Form/Input";
import styles from "./index.module.scss";
import { ISPHONE, ISPHONEOBERVER } from "@/utils/pattern";

import React from "react";

import dynamic from "next/dynamic";
const CountryModal = dynamic(() => import("@/components/Form/CountrySelect"), {
  ssr: false,
});

function AddressForm({ LANG }, ref) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm();
  const formRef = React.useRef();
  const [areaMap, setAreaMap] = React.useState(null);
  const buttonRef = React.useRef(null);
  const [addressForm, setAddressForm] = React.useState({});

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
        return formValues[item] || item === "address2";
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
        <CountryModal
          disabled={true}
          value={watch("area")}
          setValue={(e) => {
            setAreaMap(e);
            setValue("area", e.area_text);
          }}
          error={errors.area?.message}
          inputProps={{
            ...register("area", {
              required: LANG["store.order.address_form.area_required"],
            }),
          }}
        />
      </div>
      <div className={styles.form_group_1_1}>
        <div className={styles.form_item}>
          <Input
            label={LANG["store.order.address_form.first_name"]}
            error={errors.first_name?.message}
            focus={addressForm?.first_name}
            inputProps={{
              maxLength: 15,
              ...register("first_name", {
                required: LANG["store.order.address_form.first_name_require"],
              }),
            }}
          />
        </div>
        <div className={styles.form_item}>
          <Input
            label={LANG["store.order.address_form.last_name"]}
            error={errors.last_name?.message}
            focus={addressForm?.last_name}
            inputProps={{
              maxLength: 15,
              ...register("last_name", {
                required: LANG["store.order.address_form.last_name_require"],
              }),
            }}
          />
        </div>
      </div>
      <div className={styles.form_group_1_2}>
        {areaMap?.area_code === "cn" ? null : (
          <div className={`${styles.form_item} ${styles.form_item_1}`}>
            <Input
              error={errors.short_phone?.message}
              label={LANG["store.order.address_form.area_code"]}
              focus={addressForm.short_phone}
              inputProps={{
                maxLength: 5,
                ...register("short_phone", {
                  required: LANG["store.order.address_form.code_require"],
                  pattern: {
                    value: ISPHONEOBERVER,
                    message: LANG["store.order.address_form.incorrect_code"],
                  },
                }),
              }}
            />
          </div>
        )}
        <div className={`${styles.form_item} ${styles.form_item_2}`}>
          <Input
            error={errors.phone?.message}
            label={LANG["store.order.address_form.phone"]}
            focus={addressForm.phone}
            inputProps={{
              maxLength: 11,
              ...register("phone", {
                required: LANG["store.order.address_form.phone_require"],
                pattern: {
                  value: areaMap?.area_code === "cn" ? ISPHONE : ISPHONEOBERVER,
                  message: LANG["store.order.address_form.incorrect_phone"],
                },
              }),
            }}
          />
        </div>
      </div>
      <div className={styles.form_item}>
        <Input
          error={errors.zip_code?.message}
          label={LANG["store.order.address_form.zip_code"]}
          focus={addressForm.zip_code}
          inputProps={{
            maxLength: 20,
            ...register("zip_code", {
              required: LANG["store.order.address_form.zip_code_require"],
            }),
          }}
        />
      </div>
      <div className={styles.form_item}>
        <Input
          error={errors.address1?.message}
          label={LANG["store.order.address_form.address"]}
          focus={addressForm.address1}
          inputProps={{
            maxLength: 500,
            ...register("address1", {
              required: LANG["store.order.address_form.address_require"],
            }),
          }}
        />
      </div>
      <div className={styles.form_item}>
        <Input
          error={errors.address2?.message}
          required={false}
          label={LANG["store.order.address_form.detail_address"]}
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
