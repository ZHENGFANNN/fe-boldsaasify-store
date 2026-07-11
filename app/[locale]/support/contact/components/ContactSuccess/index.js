"use client";

import React from "react";
import styles from "./index.module.scss";

// Contact 表单提交成功后的展示态，取代原本不明显的 success toast。
// 复用于页内 ContactForm 与全局 ContactModal，文案走 LANG + 英文兜底。
export default function ContactSuccess({ LANG, onReset }) {
  return (
    <div className={styles.success} data-role="contact-success">
      <div className={styles.icon_wrapper}>
        <span className={styles.icon_ring} aria-hidden="true" />
        <svg
          className={styles.icon}
          width="40"
          height="40"
          viewBox="0 0 40 40"
          fill="none"
          aria-hidden="true"
        >
          <circle cx="20" cy="20" r="20" fill="#1f9d55" />
          <path
            d="M12.5 20.6L17.6 25.7L27.8 15.2"
            stroke="#fff"
            strokeWidth="2.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <h2 className={styles.title}>
        {LANG?.["common.contact.success_title"] || "Thank you"}
      </h2>
      <p className={styles.desc}>
        {LANG?.["common.contact.success_desc"] ||
          "We've received your message and will get back to you as soon as possible."}
      </p>
      <button type="button" className={styles.reset_btn} onClick={onReset}>
        {LANG?.["common.contact.send_another"] || "Send another message"}
      </button>
    </div>
  );
}
