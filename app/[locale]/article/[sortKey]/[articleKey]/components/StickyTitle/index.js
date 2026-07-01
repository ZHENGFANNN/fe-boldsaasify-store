/** @format */

"use client";
import styles from "../../page.module.scss";
import React from "react";

export default function StickyTitle({ title }) {
  return (
    <div className={styles.nav_posity_container}>
      <h1 className={styles.nav_posity_title}>{title}</h1>
    </div>
  );
}
