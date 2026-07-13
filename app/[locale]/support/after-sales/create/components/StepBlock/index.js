"use client";

import React from "react";
import styles from "./index.module.scss";

// 通用 accordion 步骤容器：仅负责布局与状态展示，不感知任何业务字段。
//   step        Number   步序号（会展示在 badge 中）
//   title       String   标题文案
//   subtitle    String   激活态下标题下方的说明文字（可选）
//   active      Bool     是否为当前展开步
//   done        Bool     是否已完成（badge 变 ✓、可显示摘要或 Edit）
//   locked      Bool     是否被前置步骤锁定（灰化视觉）
//   editLabel   String   Edit 按钮文案（active===false && done 时展示）
//   onEdit      Function 点击 Edit 时回调
//   summary     Node     !active && done 时展示的已填摘要（可选）
//   children    Node     active 时展示的表单体
export default function StepBlock({
  step,
  title,
  subtitle,
  active,
  done,
  locked = false,
  editLabel = "Edit",
  onEdit,
  summary = null,
  children,
}) {
  const twoDigit = String(step).padStart(2, "0");
  const wrapClass = [
    styles.stepblock,
    active ? styles.active : "",
    done ? styles.done : "",
    locked ? styles.locked : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <section className={wrapClass}>
      <div className={styles.stepblock_head}>
        <span className={styles.step_badge} aria-hidden="true">
          {done ? (
            <svg viewBox="0 0 24 24" fill="none">
              <path
                d="M4 12l6 6 12-14"
                stroke="currentColor"
                strokeWidth="2.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          ) : (
            twoDigit
          )}
        </span>
        <div className={styles.stepblock_title_wrap}>
          <h2 className={styles.stepblock_title}>{title}</h2>
          {active && subtitle ? (
            <p className={styles.stepblock_subtitle}>{subtitle}</p>
          ) : null}
        </div>
        {!active && done && onEdit ? (
          <button type="button" className={styles.step_edit} onClick={onEdit}>
            {editLabel}
          </button>
        ) : null}
      </div>

      {active ? (
        <div className={styles.stepblock_content}>{children}</div>
      ) : done && summary ? (
        <div className={styles.stepblock_summary}>{summary}</div>
      ) : null}
    </section>
  );
}
