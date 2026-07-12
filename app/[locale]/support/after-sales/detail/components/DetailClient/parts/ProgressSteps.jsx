"use client";

import React from "react";
import styles from "../index.module.scss";

// 6 步进度条：横向 6 个圆圈 + label + 时间戳；当前高亮点用方形边角标（对齐参考图 02 号态）。
// 参数：
//   steps  : [{title, time?, done, current}] 长度 6
//   compact: 移动端紧凑模式（小屏 gap 变窄）
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
              {s.current ? (
                // 当前步：数字用方形角标包裹（对齐参考图 02 高亮样式）
                <span className={styles.p_dot_current}>
                  <span className={styles.p_dot_current_corner} />
                  <span className={styles.p_dot_current_corner} />
                  <span className={styles.p_dot_current_corner} />
                  <span className={styles.p_dot_current_corner} />
                  <b>{String(no).padStart(2, "0")}</b>
                </span>
              ) : (
                <span className={styles.p_dot}>
                  {s.done ? "✓" : String(no).padStart(2, "0")}
                </span>
              )}
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
