"use client";

import React from "react";
import styles from "./index.module.scss";

// 简洁的分段切换组件，样式对齐售后流程内其他 tabs 视觉：
//   options   Array<{value, label}>   选项列表，label 支持任意 ReactNode
//   value     string                  当前选中值
//   onChange  (value)=>void           切换回调
//   className string                  额外容器 class（可选）
export default function SegmentTabs({
  options = [],
  value,
  onChange,
  className = "",
}) {
  return (
    <div
      className={`${styles.tabs} ${className}`.trim()}
      role="tablist"
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="tab"
            aria-selected={active}
            className={`${styles.tab} ${active ? styles.active : ""}`}
            onClick={() => {
              if (!active) onChange?.(opt.value);
            }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
