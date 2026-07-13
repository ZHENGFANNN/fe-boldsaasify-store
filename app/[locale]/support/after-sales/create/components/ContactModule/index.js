"use client";

import React from "react";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import styles from "./index.module.scss";
import Api from "../../../api";
import { useCreateWizard } from "../../context";
import {
  contactEmailAtom,
  contactPhoneAtom,
  agreePrivacyAtom,
  methodAtom,
  afterTypeAtom,
  descriptionAtom,
  mediaListAtom,
  selectedOrderAtom,
  productPayloadAtom,
  purchaseTimeAtom,
  purchaseChannelAtom,
  purchaseOrderNoAtom,
  uploadingCountAtom,
  submittingAtom,
  submittedServiceNoAtom,
  activeStepAtom,
} from "../../atoms";

export default function ContactModule() {
  const {
    T,
    LANG,
    tip,
    EMAIL_RE,
    PRIVACY_ARTICLE_PATH,
    localeHref,
    locale,
  } = useCreateWizard();

  const [contactEmail, setContactEmail] = useAtom(contactEmailAtom);
  const [contactPhone, setContactPhone] = useAtom(contactPhoneAtom);
  const [agreePrivacy, setAgreePrivacy] = useAtom(agreePrivacyAtom);

  // 汇总提交所需状态（读值即可，无需订阅 setter）
  const method = useAtomValue(methodAtom);
  const afterType = useAtomValue(afterTypeAtom);
  const description = useAtomValue(descriptionAtom);
  const mediaList = useAtomValue(mediaListAtom);
  const selectedOrder = useAtomValue(selectedOrderAtom);
  const productPayload = useAtomValue(productPayloadAtom);
  const purchaseTime = useAtomValue(purchaseTimeAtom);
  const purchaseChannel = useAtomValue(purchaseChannelAtom);
  const purchaseOrderNo = useAtomValue(purchaseOrderNoAtom);
  const uploadingCount = useAtomValue(uploadingCountAtom);

  const [submitting, setSubmitting] = useAtom(submittingAtom);
  const setSubmittedServiceNo = useSetAtom(submittedServiceNoAtom);
  const setActiveStep = useSetAtom(activeStepAtom);

  const onSubmit = async () => {
    if (submitting) return;
    if (uploadingCount > 0) {
      tip(
        T(
          LANG,
          "user_account.after_sale.media.wait_upload",
          "Please wait for uploads to finish."
        ),
        "info"
      );
      return;
    }
    if (!productPayload) {
      setActiveStep(1);
      return;
    }

    const media = mediaList
      .filter((m) => m.url)
      .map(({ url, name, type, size }) => ({ url, name, type, size }));

    const payload = {
      report_type: method,
      type: afterType,
      description: description.trim(),
      media,
      contact_email: contactEmail.trim(),
      contact_phone: contactPhone.trim(),
      product_key: productPayload.product_key,
      product_name: productPayload.product_name,
      sort_key: productPayload.sort_key,
    };
    if (method === "order") {
      payload.order_number = selectedOrder?.order_number || "";
    } else {
      payload.purchase_time = purchaseTime;
      payload.purchase_channel = purchaseChannel.trim();
      payload.purchase_order_no = purchaseOrderNo.trim();
    }

    setSubmitting(true);
    try {
      const res = await Api.createAfterService(payload);
      if (res.code !== 0) throw new Error("code!==0");
      // 顶层 CreateWizard 会在 submittedServiceNo !== null 时切到 SubmitSuccess
      setSubmittedServiceNo(res.data?.service_no ?? "");
    } catch (err) {
      tip(
        T(
          LANG,
          "user_account.after_sale.submit_fail",
          "Submission failed. Please try again."
        ),
        "error"
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <label className={styles.field}>
        <span className={styles.field_label}>
          {T(LANG, "user_account.after_sale.contact.email", "Email")}
          <i>*</i>
        </span>
        <input
          type="email"
          value={contactEmail}
          onChange={(e) => setContactEmail(e.target.value)}
          placeholder="you@example.com"
        />
      </label>
      <label className={styles.field}>
        <span className={styles.field_label}>
          {T(LANG, "user_account.after_sale.contact.phone", "Phone")}
          <i>*</i>
        </span>
        <input
          type="tel"
          value={contactPhone}
          onChange={(e) => setContactPhone(e.target.value)}
          placeholder={T(
            LANG,
            "user_account.after_sale.contact.phone_ph",
            "Contact phone number"
          )}
        />
      </label>

      <label className={styles.privacy}>
        <input
          type="checkbox"
          checked={agreePrivacy}
          onChange={(e) => setAgreePrivacy(e.target.checked)}
        />
        <span>
          {T(
            LANG,
            "user_account.after_sale.privacy.prefix",
            "I have read and agree to the"
          )}{" "}
          <a
            href={localeHref(PRIVACY_ARTICLE_PATH, locale)}
            target="_blank"
            rel="noopener noreferrer"
          >
            {T(
              LANG,
              "user_account.after_sale.privacy.link",
              "After-Sales Privacy Policy"
            )}
          </a>
        </span>
      </label>

      <div className={styles.step_actions}>
        <button
          type="button"
          className={styles.btn_primary}
          onClick={onSubmit}
          disabled={
            submitting ||
            !EMAIL_RE.test(contactEmail) ||
            !contactPhone.trim() ||
            !agreePrivacy
          }
        >
          {T(LANG, "user_account.after_sale.submit", "Submit")}
        </button>
      </div>
    </>
  );
}
