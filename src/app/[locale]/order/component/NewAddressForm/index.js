"use client";

import React from "react";
import { useForm } from "react-hook-form";
import styles from "./index.module.scss";
import Input from "@/components/Form/Input";
import { ISPHONE, ISPHONEOBERVER } from "@/utils/pattern";
import CountryModal from "@/components/Form/CountrySelect";
import ShowTipModal from "@/components/Modal/ShowTipModal";
import Api from "../../api";

export default function NewAddressForm({ LANG, onFinish }) {
  const [show, setShow] = React.useState(false);
  const tipRef = React.useRef(null);

  React.useEffect(() => {
    if (show) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "scroll";
    }
  }, [show]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm();
  const [areaMap, setAreaMap] = React.useState(null);
  const [loading, setLoading] = React.useState(false);

  const onSubmit = async (values) => {
    if (loading) return;
    setLoading(true);
    try {
      const { area, short_phone, ...data } = values;
      const res = await Api.saveUserAddress({
        ...data,
        ...areaMap,
        short_phone: short_phone || "86",
      });
      if (res.code === 0) {
        reset();
        onFinish();
        tipRef.current.show({
          text: LANG["store.order.address_form.created_success"],
          type: "success",
        });
        setShow(false);
      } else {
        throw new Error("code !== 0");
      }
    } catch (err) {
      tipRef.current.show({
        text: LANG["store.order.address_form.create_fail"],
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.main_btn}>
        <button onClick={() => setShow(true)}>
          {LANG["store.order.address_form.create_address"]}
        </button>
      </div>
      <div className={`${styles.modal} ${show ? styles.show : ""}`}>
        <div className={styles.modal_content}>
          <h2>{LANG["store.order.address_form.create_address"]}</h2>
          <form
            onSubmit={handleSubmit(onSubmit)}
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
                  inputProps={{
                    maxLength: 15,
                    ...register("first_name", {
                      required:
                        LANG["store.order.address_form.first_name_require"],
                    }),
                  }}
                />
              </div>
              <div className={styles.form_item}>
                <Input
                  label={LANG["store.order.address_form.last_name"]}
                  error={errors.last_name?.message}
                  inputProps={{
                    maxLength: 15,
                    ...register("last_name", {
                      required:
                        LANG["store.order.address_form.last_name_require"],
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
                    inputProps={{
                      maxLength: 5,
                      ...register("short_phone", {
                        required: LANG["store.order.address_form.code_require"],
                        pattern: {
                          value: ISPHONEOBERVER,
                          message:
                            LANG["store.order.address_form.incorrect_code"],
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
                  inputProps={{
                    maxLength: 11,
                    ...register("phone", {
                      required: LANG["store.order.address_form.phone_require"],
                      pattern: {
                        value:
                          areaMap?.area_code === "cn"
                            ? ISPHONE
                            : ISPHONEOBERVER,
                        message:
                          LANG["store.order.address_form.incorrect_phone"],
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
                inputProps={{
                  maxLength: 500,
                  ...register("address2"),
                }}
              />
            </div>
            <div className={styles.btn_container}>
              <div
                className={styles.btn_cancel}
                onClick={() => {
                  setShow(false);
                  document.body.style.overflow = "scroll";
                }}
              >
                {LANG["store.order.address_form.close"]}
              </div>
              <button
                type="submit"
                className={styles.btn_confirm}
                onClick={() => {
                  document.body.style.overflow = "scroll";
                }}
              >
                {LANG["store.order.address_form.confirm"]}
              </button>
            </div>
          </form>
        </div>
      </div>
      <ShowTipModal ref={tipRef} />
    </div>
  );
}
