"use client";

import React from "react";
import { useForm } from "react-hook-form";
import styles from "./index.module.scss";
import Input from "../../../../../components/Form/Input";
import { ISPHONE, ISPHONEOBERVER } from "../../../../../utils/pattern";
import CountryModal from "../../../../../components/Form/CountrySelect";
import ShowTipModal from "../../../../../components/Modal/ShowTipModal";
import Api from "../../api";

export default function NewAddressForm({ onFinish, LANG }) {
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
          text: LANG["www.account.shipping_address.created_success"],
          type: "success",
        });
        setShow(false);
      } else {
        throw new Error("code !== 0");
      }
    } catch (err) {
      tipRef.current.show({
        text: LANG["www.account.shipping_address.craeted_fail"],
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
          {LANG["www.account.shipping_address.create_address"]}
        </button>
      </div>
      <div className={`${styles.modal} ${show ? styles.show : ""}`}>
        <div className={styles.modal_content}>
          <h2>{LANG["www.account.shipping_address.create_address"]}</h2>
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
                    required:
                      LANG["www.account.shipping_address.area_required"],
                  }),
                }}
              />
            </div>
            <div className={styles.form_group_1_1}>
              <div className={styles.form_item}>
                <Input
                  label={LANG["www.account.shipping_address.first_name"]}
                  error={errors.first_name?.message}
                  inputProps={{
                    maxLength: 15,
                    ...register("first_name", {
                      required:
                        LANG["www.account.shipping_address.first_name_require"],
                    }),
                  }}
                />
              </div>
              <div className={styles.form_item}>
                <Input
                  label={LANG["www.account.shipping_address.last_name"]}
                  error={errors.last_name?.message}
                  inputProps={{
                    maxLength: 15,
                    ...register("last_name", {
                      required:
                        LANG["www.account.shipping_address.last_name_require"],
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
                    label={LANG["www.account.shipping_address.area_code"]}
                    inputProps={{
                      maxLength: 5,
                      ...register("short_phone", {
                        required:
                          LANG["www.account.shipping_address.code_require"],
                        pattern: {
                          value: ISPHONEOBERVER,
                          message:
                            LANG["www.account.shipping_address.incorrect_ode"],
                        },
                      }),
                    }}
                  />
                </div>
              )}
              <div className={`${styles.form_item} ${styles.form_item_2}`}>
                <Input
                  error={errors.phone?.message}
                  label={LANG["www.account.shipping_address.phone"]}
                  inputProps={{
                    maxLength: 11,
                    ...register("phone", {
                      required:
                        LANG["www.account.shipping_address.phone_require"],
                      pattern: {
                        value:
                          areaMap?.area_code === "cn"
                            ? ISPHONE
                            : ISPHONEOBERVER,
                        message:
                          LANG["www.account.shipping_address.incorrect_phone"],
                      },
                    }),
                  }}
                />
              </div>
            </div>
            <div className={styles.form_item}>
              <Input
                error={errors.zip_code?.message}
                label={LANG["www.account.shipping_address.zip_code"]}
                inputProps={{
                  maxLength: 20,
                  ...register("zip_code", {
                    required:
                      LANG["www.account.shipping_address.zip_code_required"],
                  }),
                }}
              />
            </div>
            <div className={styles.form_item}>
              <Input
                error={errors.address1?.message}
                label={LANG["www.account.shipping_address.address"]}
                inputProps={{
                  maxLength: 500,
                  ...register("address1", {
                    required:
                      LANG["www.account.shipping_address.address_require"],
                  }),
                }}
              />
            </div>
            <div className={styles.form_item}>
              <Input
                error={errors.address2?.message}
                required={false}
                label={LANG["www.account.shipping_address.detail_address"]}
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
                {LANG["www.account.shipping_address.close"]}
              </div>
              <button
                type="submit"
                className={styles.btn_confirm}
                onClick={() => {
                  document.body.style.overflow = "scroll";
                }}
              >
                {LANG["www.account.shipping_address.confirm"]}
              </button>
            </div>
          </form>
        </div>
      </div>
      <ShowTipModal ref={tipRef} />
    </div>
  );
}
