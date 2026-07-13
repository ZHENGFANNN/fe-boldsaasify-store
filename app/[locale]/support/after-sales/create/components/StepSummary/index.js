"use client";

import React from "react";
import styles from "./index.module.scss";

// 步骤完成态的摘要展示（对应「已完成」态下 StepBlock 折叠时的 UI）
//   rows   Array<[label, value]>   键值对列表；空值请调用方在传入前过滤
export default function StepSummary({ rows = [] }) {
  if (!rows.length) return null;
  return (
    <dl className={styles.summary_list}>
      {rows.map(([label, value], i) => (
        <div className={styles.summary_line} key={i}>
          <dt>{label}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  );
}
