"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { isEmail } from "@/utils/pattern";
import GlobalContext from "@/[locale]/context";
import Api from "@/components/Layout/api";
import FormInput from "@/components/Form/FormInput";
import FormTextarea from "@/components/Form/FormTextArea";
import FormItem from "@/components/Form/FormItem";
import ShowTipModal from "@/components/Modal/ShowTipModal";
import styles from "./index.module.scss";

// Contact 页内联表单（类 Shopify）。字段与后端契约对齐全局 ContactModal：
// first_name / last_name / email(必填+isEmail) / other_contact(选填, UI 呈现为 Phone)
// / content(必填 textarea, UI 呈现为 Message)。提交 type:"contact"。
export default function ContactForm() {
  const tipRef = React.useRef(null);
  const { locale, LANG, area } = React.useContext(GlobalContext);
  const [loading, setLoading] = React.useState(false);

  const {
    register,
    handleSubmit,
    reset,
    clearErrors,
    formState: { errors },
  } = useForm();

  const onSubmit = React.useCallback(
    async (values) => {
      if (loading) return;
      setLoading(true);
      try {
        const data = await Api.contactForm({
          path: location.pathname,
          language: locale,
          area,
          type: "contact",
          ...values,
        });
        if (data.code === 0) {
          // best-effort：把邮箱补收进邮箱收集(订阅)模块。走同一端点、靠 body.type
          // 区分；失败不影响联系表单成功 UX，故 fire-and-forget + catch 吞掉。
          Api.contactForm({
            type: "subscribe",
            email: values.email,
            path: location.pathname,
            language: locale,
            area,
          }).catch((err) => console.log("[contactForm subscribe]: ", err));

          tipRef.current.show({
            type: "success",
            text: LANG["common.contact.submit_success"] || "Submitted successfully",
          });
          reset();
          clearErrors();
        } else {
          throw new Error("code!==0");
        }
      } catch (err) {
        console.log("[contactForm]: ", err);
        tipRef.current.show({
          type: "error",
          text: LANG["common.contact.submit_fail"] || "Submission failed, please try again",
        });
      } finally {
        setLoading(false);
      }
    },
    [loading, locale, area, LANG, reset, clearErrors]
  );

  return (
    <section className={styles.form_section}>
      <div className={styles.form_wrapper}>
        <h2 className={styles.form_title}>
          {LANG["common.contact.title"] || "Contact us"}
        </h2>
        <p className={styles.form_subtitle}>
          {LANG["common.contact.form_subtitle"] ||
            "Have a question about our lab-grown diamonds or your order? Send us a message and we'll get back to you shortly."}
        </p>
        <form onSubmit={(e) => handleSubmit(onSubmit)(e)}>
          <FormItem>
            <FormInput
              label={LANG["common.contact.first_name"] || "First name"}
              error={errors.first_name?.message}
              inputProps={{
                maxLength: 15,
                ...register("first_name", {
                  required: LANG["common.contact.first_name"] || "First name",
                }),
              }}
            />
            <FormInput
              label={LANG["common.contact.last_name"] || "Last name"}
              error={errors.last_name?.message}
              inputProps={{
                maxLength: 15,
                ...register("last_name", {
                  required: LANG["common.contact.last_name"] || "Last name",
                }),
              }}
            />
          </FormItem>
          <FormInput
            label={LANG["common.contact.email"] || "Email"}
            error={errors.email?.message}
            inputProps={{
              ...register("email", {
                required: LANG["common.contact.email"] || "Email",
                pattern: {
                  value: isEmail,
                  message: LANG["common.contact.email"] || "Email",
                },
              }),
            }}
          />
          <FormInput
            label={LANG["common.contact.phone"] || "Phone (optional)"}
            error={errors.other_contact?.message}
            required={false}
            inputProps={{
              maxLength: 100,
              ...register("other_contact"),
            }}
          />
          <FormTextarea
            label={LANG["common.contact.message"] || "Message"}
            error={errors.content?.message}
            inputProps={{
              maxLength: 1000,
              ...register("content", {
                required: LANG["common.contact.message"] || "Message",
              }),
            }}
          />
          <button
            type="submit"
            className={styles.submit_btn}
            disabled={loading}
          >
            {loading
              ? LANG["common.contact.submitting"] || "Sending..."
              : LANG["common.contact.submit"] || "Submit"}
          </button>
        </form>
      </div>
      <ShowTipModal ref={tipRef} />
    </section>
  );
}
