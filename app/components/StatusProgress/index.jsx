"use client";

import React from "react";
import styles from "./index.module.scss";

/**
 * StatusProgress —— 通用横向状态进度条（外层公共组件）。
 *
 * 设计意图（以售后为例）：
 *   提交成功 → 待处理 → 待完成      （activeIndex=0，高亮第 1 块）
 *   提交成功 → 处理中 → 待完成      （activeIndex=1，高亮第 2 块）
 *   提交成功 → 处理完成 → 已完成    （activeIndex=2，高亮第 3 块）
 *
 * 由调用方把「当前状态」映射成 steps + activeIndex 传入，本组件只负责渲染：
 *   - index <  activeIndex → done（已完成，实心）
 *   - index === activeIndex → active（当前，高亮）
 *   - index >  activeIndex → todo（待办，置灰）
 *
 * Props:
 *   steps       : string[] | { label: string }[]  各步文案（每步文案随状态变化，由调用方决定）
 *   activeIndex : number                            当前高亮到第几块（0 基）
 *   className   : string                            额外容器类名
 */
const StatusProgress = React.memo(function StatusProgress({
  steps = [],
  activeIndex = 0,
  className = ""
}) {
  const list = steps.map((s) => (typeof s === "string" ? { label: s } : s));

  return (
    <div className={`${styles.progress} ${className}`}>
      {list.map((step, i) => {
        const done = i < activeIndex;
        const active = i === activeIndex;
        const state = done ? "done" : active ? "active" : "todo";
        return (
          <React.Fragment key={i}>
            <div className={`${styles.step} ${styles[state]}`}>
              <span className={styles.dot}>
                {done ? (
                  <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
                    <path
                      d="M5 12.5l4.2 4.2L19 7"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                ) : (
                  String(i + 1).padStart(2, "0")
                )}
              </span>
              <span className={styles.label}>{step.label}</span>
            </div>
            {i < list.length - 1 ? (
              <span
                className={`${styles.line} ${
                  i < activeIndex ? styles.line_done : ""
                }`}
              />
            ) : null}
          </React.Fragment>
        );
      })}
    </div>
  );
});

export default StatusProgress;
