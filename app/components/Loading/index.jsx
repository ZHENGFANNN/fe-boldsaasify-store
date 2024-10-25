"use client";

import styles from "./index.module.scss";
export default function Loading({ height = "100%", width = "100%" }) {
  return (
    <div
      className={styles.container}
      style={{
        height,
        width,
      }}
    >
      <span className={styles.loading}></span>
    </div>
  );
}
