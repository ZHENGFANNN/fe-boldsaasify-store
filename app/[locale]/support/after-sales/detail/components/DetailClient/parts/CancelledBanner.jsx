"use client";

import React from "react";
import styles from "../index.module.scss";

// 已取消状态卡片（参考图第一张）：红色角标 + X 图标 + "服务已取消" 文案。
// 附上 cancel_reason（若有）。
const CancelledBanner = React.memo(function CancelledBanner({ reason, LANG, T }) {
  return (
    <div className={styles.cancelled_card}>
      <span className={`${styles.cancelled_corner} ${styles.top_left}`} />
      <span className={`${styles.cancelled_corner} ${styles.top_right}`} />
      <span className={`${styles.cancelled_corner} ${styles.bottom_left}`} />
      <span className={`${styles.cancelled_corner} ${styles.bottom_right}`} />
      <div className={styles.cancelled_body}>
        <span className={styles.cancelled_icon}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <rect width="24" height="24" rx="4" fill="#ef4444" />
            <path
              d="M8 8l8 8M16 8l-8 8"
              stroke="#fff"
              strokeWidth="2.4"
              strokeLinecap="round"
            />
          </svg>
        </span>
        <div className={styles.cancelled_text}>
          <b>
            {T(
              LANG,
              "user_account.after_sale.status.cancelled",
              "Service Cancelled"
            )}
          </b>
          {reason ? (
            <span className={styles.cancelled_reason}>{reason}</span>
          ) : null}
        </div>
      </div>
    </div>
  );
});

export default CancelledBanner;
