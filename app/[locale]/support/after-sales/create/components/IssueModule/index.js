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
  const { T, TL, LANG, typeLabelMap, AFTER_SALE_TYPES } = useCreateWizard();

  const [afterType, setAfterType] = useAtom(afterTypeAtom);
  const [description, setDescription] = useAtom(descriptionAtom);
  const step2Done = useAtomValue(step2DoneAtom);
  const [, setActiveStep] = useAtom(activeStepAtom);

  const confirmStep2 = () => {
    if (!step2Done) return;
    setActiveStep(3);
  };

  return (
    <>
      <div className={styles.section_label}>
        {TL(
          "user_account.after_sale.service_type",
          "售后类型",
          "After-sales type"
        )}
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
          disabled={!step2Done}
        >
          {T(LANG, "user_account.after_sale.next", "Next")}
        </button>
      </div>
    </>
  );
}
