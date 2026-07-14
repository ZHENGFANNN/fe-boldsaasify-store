"use client";

import React from "react";
import ErrorIcon from "@/components/Icon/ErrorIcon";
import styles from "../index.module.scss";

// 已取消状态卡片：红色 ErrorIcon + "Service Cancelled" 文案 + 可选原因。
const CancelledBanner = React.memo(function CancelledBanner({ reason, LANG, T }) {
  return (
    <div className={styles.cancelled_card}>
      <div className={styles.cancelled_body}>
        <span className={styles.cancelled_icon}>
          <ErrorIcon width={24} height={24} />
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
