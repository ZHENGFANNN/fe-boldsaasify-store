/** @format */

"use client";
import styles from "../../page.module.scss";
import React from "react";

export default function StickyTitle({ CONFIG }) {
  return (
    <div className={styles.nav_posity_container}>
      <h1 className={styles.nav_posity_title}>
        {CONFIG["www.protocol.service.title"]}
      </h1>
    </div>
  );
}
