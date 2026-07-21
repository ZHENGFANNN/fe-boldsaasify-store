"use client";

import React from "react";
import { useForm } from "react-hook-form";
import styles from "./index.module.scss";
import Input from "@/components/Form/FormInput";
import FormSelect from "@/components/Form/FormSelect";
import Button from "@/components/Button";
import { ISPHONE, ISPHONEOBERVER } from "@/utils/pattern";
import ShowTipModal from "@/components/Modal/ShowTipModal";
import FormCountryItem from "@/components/Form/FormCountryItem";
import GlobalContext from "@/[locale]/context";
import AddressAutocomplete from "@/components/Address/AddressAutocomplete";
import PasteAddressBox from "@/components/Address/PasteAddressBox";
import { US_STATE_OPTIONS } from "@/const/usStates";

// 用户地址「新增 / 编辑」弹窗。可选自渲染触发按钮，也可完全受控使用。
//
// props:
//  - LANG: 语言包
//  - apiSave: 保存/新增/编辑接口(必填)。编辑模式会在 payload 追加 id
//  - apiParse?/apiAutocomplete?/apiDetail?: 粘贴解析 & 地址联想接口(可选)
//  - editItem?: 传入即进入编辑模式(回填字段 + 携带 id 提交)
//  - open?: 受控开启；未传则内部维护
//  - onClose?: 受控关闭回调
//  - onFinish?: 保存成功回调(通常触发上层重拉列表)
//  - showTriggerButton?: 是否渲染「新增地址」按钮，默认 true。受控模式(有 open)自动关闭
export default function AddressFormModal({
  LANG,
  apiSave,
  apiParse,
  apiAutocomplete,
  apiDetail,
  editItem = null,
  open,
  onClose,
  onFinish,
  showTriggerButton = true,
}) {
  const { locale } = React.useContext(GlobalContext);
  const controlled = typeof open === "boolean";
  const isEdit = !!editItem;
  const [internalShow, setInternalShow] = React.useState(false);
  const show = controlled ? open : internalShow;
  // 受控模式不再渲染触发按钮(由父级控制打开)。
  const renderTrigger = showTriggerButton && !controlled;

  const tipRef = React.useRef(null);
  const formRef = React.useRef(null);

  const closeModal = React.useCallback(() => {
    document.body.style.overflow = "scroll";
    if (controlled) {
      onClose?.();
    } else {
      setInternalShow(false);
    }
  }, [controlled, onClose]);

  // 原生 setter + input 事件回填：既更新 react-hook-form，又触发 FormInput
  // 浮动 label（内部 state 依赖 input 事件）。
  const fillField = (name, value) => {
    const el = formRef.current?.querySelector(`[name="${name}"]`);
    if (!el || value == null || value === "") return;
    const setter = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype,
      "value"
    ).set;
    setter.call(el, value);
    el.dispatchEvent(new Event("input", { bubbles: true }));
  };

  const handleParsed = (p) => {
    fillField("first_name", p.first_name);
    fillField("last_name", p.last_name);
    fillField("short_phone", p.short_phone);
    fillField("phone", p.phone);
    fillField("zip_code", p.zip_code);
    fillField("address1", p.address1);
    fillField("address2", p.address2);
  };

  const handleParseError = () => {
    tipRef.current?.show({
      text:
        LANG["user_account.shipping_address.parse_fail"] ||
        "Couldn't parse the address. Please enter it manually.",
      type: "error",
    });
  };

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
  const [stateDefault, setStateDefault] = React.useState("");

  // 编辑模式：弹窗打开时回填各字段；新增模式打开时清空。
  React.useEffect(() => {
    if (!show) return;
    if (isEdit && editItem) {
      setStateDefault(editItem.state || "");
      const raf = requestAnimationFrame(() => {
        fillField("first_name", editItem.first_name);
        fillField("last_name", editItem.last_name);
        fillField("short_phone", editItem.short_phone);
        fillField("phone", editItem.phone);
        fillField("zip_code", editItem.zip_code);
        fillField("address1", editItem.address1);
        fillField("address2", editItem.address2);
        setValue("state", editItem.state || "");
      });
      return () => cancelAnimationFrame(raf);
    }
    setStateDefault("");
    reset();
    return undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show, isEdit, editItem]);

  const onSubmit = async (values) => {
    if (loading) return;
    // 美国地区州必填校验（FormSelect 未经 register 强约束，这里兜底）。
    if (areaMap?.area_code === "us" && !values.state) {
      tipRef.current?.show({
        text:
          LANG["user_account.shipping_address.state_required"] ||
          "Please select a state",
        type: "error",
      });
      return;
    }
    setLoading(true);
    try {
      const { area, short_phone, state, ...data } = values;
      const payload = {
        ...data,
        ...areaMap,
        short_phone: short_phone || "86",
        state: areaMap?.area_code === "us" ? state || "" : "",
      };
      if (isEdit && editItem?.id != null) payload.id = editItem.id;
      const res = await apiSave(payload);
      if (res.code === 0) {
        reset();
        onFinish?.();
        tipRef.current.show({
          text: isEdit
            ? LANG["user_account.shipping_address.updated_success"] ||
              LANG["user_account.shipping_address.created_success"]
            : LANG["user_account.shipping_address.created_success"],
          type: "success",
        });
        closeModal();
      } else {
        throw new Error("code !== 0");
      }
    } catch (err) {
      tipRef.current.show({
        text: LANG["user_account.shipping_address.craeted_fail"],
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const modalTitle = isEdit
    ? LANG["user_account.shipping_address.edit_address"] ||
      LANG["user_account.shipping_address.create_address"]
    : LANG["user_account.shipping_address.create_address"];

  return (
    <div className={styles.container}>
      {renderTrigger ? (
        <div className={styles.main_btn}>
          <Button
            variant="primary"
            size="small"
            onClick={() => setInternalShow(true)}
          >
            {LANG["user_account.shipping_address.create_address"]}
          </Button>
        </div>
      ) : null}
      <div className={`${styles.modal} ${show ? styles.show : ""}`}>
        <div className={styles.modal_content}>
          <h2>{modalTitle}</h2>
          <form
            ref={formRef}
            onSubmit={handleSubmit(onSubmit)}
            className={styles.form_container}
          >
            {apiParse ? (
              <PasteAddressBox
                apiParse={apiParse}
                language={locale}
                onParsed={handleParsed}
                onError={handleParseError}
                LANG={LANG}
              />
            ) : null}
            <div className={styles.form_item}>
              <FormCountryItem
                disabled={isEdit}
                value={watch("area")}
                setValue={(e) => {
                  setAreaMap(e);
                  setValue("area", e.area_text);
                }}
                error={errors.area?.message}
                inputProps={{
                  ...register("area", {
                    required:
                      LANG["user_account.shipping_address.area_required"],
                  }),
                }}
              />
            </div>
            {areaMap?.area_code === "us" ? (
              <div className={styles.form_item}>
                <FormSelect
                  label={LANG["user_account.shipping_address.state"] || "State"}
                  options={US_STATE_OPTIONS}
                  error={errors.state?.message}
                  defaultValue={stateDefault}
                  inputProps={{
                    ...register("state", {
                      required:
                        LANG["user_account.shipping_address.state_required"] ||
                        "Please select a state",
                    }),
                  }}
                  noResultsText={LANG["common.other.no_results"] || "No results"}
                />
              </div>
            ) : null}
            <div className={styles.form_group_1_1}>
              <div className={styles.form_item}>
                <Input
                  label={LANG["user_account.shipping_address.first_name"]}
                  error={errors.first_name?.message}
                  inputProps={{
                    maxLength: 15,
                    ...register("first_name", {
                      required:
                        LANG["user_account.shipping_address.first_name_require"],
                    }),
                  }}
                />
              </div>
              <div className={styles.form_item}>
                <Input
                  label={LANG["user_account.shipping_address.last_name"]}
                  error={errors.last_name?.message}
                  inputProps={{
                    maxLength: 15,
                    ...register("last_name", {
                      required:
                        LANG["user_account.shipping_address.last_name_require"],
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
                    label={LANG["user_account.shipping_address.area_code"]}
                    inputProps={{
                      maxLength: 5,
                      ...register("short_phone", {
                        required:
                          LANG["user_account.shipping_address.code_require"],
                        pattern: {
                          value: ISPHONEOBERVER,
                          message:
                            LANG["user_account.shipping_address.incorrect_ode"] ||
                            LANG["common.pay.pay_info.incorrect_code"],
                        },
                      }),
                    }}
                  />
                </div>
              )}
              <div className={`${styles.form_item} ${styles.form_item_2}`}>
                <Input
                  error={errors.phone?.message}
                  label={LANG["user_account.shipping_address.phone"]}
                  inputProps={{
                    maxLength: 11,
                    ...register("phone", {
                      required:
                        LANG["user_account.shipping_address.phone_require"],
                      pattern: {
                        value:
                          areaMap?.area_code === "cn"
                            ? ISPHONE
                            : ISPHONEOBERVER,
                        message:
                          LANG["user_account.shipping_address.incorrect_phone"],
                      },
                    }),
                  }}
                />
              </div>
            </div>
            <div className={styles.form_item}>
              <Input
                error={errors.zip_code?.message}
                label={LANG["user_account.shipping_address.zip_code"]}
                inputProps={{
                  maxLength: 20,
                  ...register("zip_code", {
                    required:
                      LANG["user_account.shipping_address.zip_code_required"],
                  }),
                }}
              />
            </div>
            <div className={styles.form_item}>
              {apiAutocomplete && apiDetail ? (
                <AddressAutocomplete
                  error={errors.address1?.message}
                  label={LANG["user_account.shipping_address.address"]}
                  apiAutocomplete={apiAutocomplete}
                  apiDetail={apiDetail}
                  language={locale}
                  regionCode={areaMap?.area_code}
                  onSelect={(addr) => {
                    fillField("zip_code", addr.zip_code);
                    fillField("address1", addr.address1);
                    fillField("address2", addr.address2);
                  }}
                  inputProps={{
                    maxLength: 500,
                    ...register("address1", {
                      required:
                        LANG["user_account.shipping_address.address_require"],
                    }),
                  }}
                />
              ) : (
                <Input
                  error={errors.address1?.message}
                  label={LANG["user_account.shipping_address.address"]}
                  inputProps={{
                    maxLength: 500,
                    ...register("address1", {
                      required:
                        LANG["user_account.shipping_address.address_require"],
                    }),
                  }}
                />
              )}
            </div>
            <div className={styles.form_item}>
              <Input
                error={errors.address2?.message}
                required={false}
                label={
                  LANG["user_account.shipping_address.detail_address"] ||
                  LANG["common.pay.pay_info.detail_address"]
                }
                inputProps={{
                  maxLength: 500,
                  ...register("address2"),
                }}
              />
            </div>
            <div className={styles.btn_container}>
              <Button
                variant="secondary"
                type="button"
                className={styles.action_btn}
                onClick={closeModal}
              >
                {LANG["user_account.shipping_address.close"]}
              </Button>
              <Button
                type="submit"
                variant="primary"
                className={styles.action_btn}
                loading={loading}
              >
                {LANG["user_account.shipping_address.confirm"]}
              </Button>
            </div>
          </form>
        </div>
      </div>
      <ShowTipModal ref={tipRef} />
    </div>
  );
}
