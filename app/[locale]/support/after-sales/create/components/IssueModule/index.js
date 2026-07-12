"use client";

import React from "react";
import { useAtom, useAtomValue } from "jotai";
import styles from "./index.module.scss";
import MediaUploader from "../MediaUploader";
import { useCreateWizard } from "../../context";
import {
  afterTypeAtom,
  descriptionAtom,
  activeStepAtom,
  step2DoneAtom,
} from "../../atoms";

export default function IssueModule() {
  const { T, LANG, tip, typeLabelMap, AFTER_SALE_TYPES } = useCreateWizard();

  const [afterType, setAfterType] = useAtom(afterTypeAtom);
  const [description, setDescription] = useAtom(descriptionAtom);
  const step2Done = useAtomValue(step2DoneAtom);
  const [, setActiveStep] = useAtom(activeStepAtom);

  const confirmStep2 = () => {
    if (!step2Done) {
      tip(
        T(
          LANG,
          "user_account.after_sale.step2.require",
          "Please choose a service type and describe the issue."
        ),
        "error"
      );
      return;
    }
    setActiveStep(3);
  };

  return (
    <>
      <div className={styles.section_label}>
        {T(LANG, "user_account.after_sale.service_type", "How can we help?")}
        <i>*</i>
      </div>
      <div className={styles.type_options}>
        {AFTER_SALE_TYPES.map((k) => (
          <button
            type="button"
            key={k}
            className={`${styles.type_option} ${
              afterType === k ? styles.active : ""
            }`}
            onClick={() => setAfterType(k)}
          >
            {typeLabelMap[k]}
          </button>
        ))}
      </div>

      <div className={`${styles.section_label} ${styles.section_label_mt}`}>
        {T(LANG, "user_account.after_sale.description", "Describe the issue")}
        <i>*</i>
      </div>
      <textarea
        className={styles.textarea}
        rows={5}
        maxLength={2000}
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder={T(
          LANG,
          "user_account.after_sale.description_ph",
          "Tell us what happened so we can help faster."
        )}
      />

      <MediaUploader />

      <div className={styles.step_actions}>
        <button
          type="button"
          className={styles.btn_primary}
          onClick={confirmStep2}
        >
          {T(LANG, "user_account.after_sale.next", "Next")}
        </button>
      </div>
    </>
  );
}
