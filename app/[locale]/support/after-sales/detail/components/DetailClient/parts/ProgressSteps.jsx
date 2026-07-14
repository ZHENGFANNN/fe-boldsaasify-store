"use client";

import React from "react";
import styles from "../index.module.scss";

// 横向进度条：数字/勾 + label + 时间戳；当前用背景色高亮，不再使用红色角标聚焦样式。
// 参数：
//   steps  : [{title, time?, done, current}]
const ProgressSteps = React.memo(function ProgressSteps({ steps }) {
  return (
    <div className={styles.progress}>
      {steps.map((s, i) => {
        const no = i + 1;
        return (
          <React.Fragment key={no}>
            <div
              className={[
                styles.p_step,
                s.current ? styles.active : "",
                s.done ? styles.done : "",
              ].join(" ")}
            >
              <span className={styles.p_dot}>
                {s.done ? "✓" : String(no).padStart(2, "0")}
              </span>
              <span className={styles.p_label}>{s.title}</span>
              {s.time ? (
                <span className={styles.p_time}>{s.time}</span>
              ) : null}
            </div>
            {i < steps.length - 1 ? (
              <div
                className={[styles.p_line, s.done ? styles.done : ""].join(" ")}
              />
            ) : null}
          </React.Fragment>
        );
      })}
    </div>
  );
});

export default ProgressSteps;

