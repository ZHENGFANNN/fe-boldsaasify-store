/** @format */

"use client";
import styles from "../../page.module.scss";
import React from "react";

export default function StickyTitle({ LANG }) {
  return (
    <div className={styles.nav_posity_container}>
      <h1 className={styles.nav_posity_title}>
        {LANG["www.protocol_faq.content_title"]}
      </h1>
    </div>
  );
}
