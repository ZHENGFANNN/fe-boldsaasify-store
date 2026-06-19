"use client";

import styles from "./index.module.scss";

/**
 * 通用 shimmer 占位块，尺寸与布局由调用方 className / style 控制。
 * variant 取值：text | rect | circular（不用 @param 标注，避免 allowJs 下 TS 把
 * props 类型误推断为该字符串联合，导致 .tsx 调用方传 props 报 TS2322）。
 */
export default function Skeleton({
  variant = "text",
  className = "",
  style = undefined,
  width = undefined,
  height = undefined,
  "aria-hidden": ariaHidden = undefined,
  "aria-label": ariaLabel = undefined,
  role = undefined,
  ...rest
}) {
  const variantClass = styles[variant] ?? styles.text;

  return (
    <span
      className={`${styles.root} ${variantClass} ${className}`.trim()}
      style={{ width, height, ...style }}
      aria-hidden={ariaHidden ?? (ariaLabel ? undefined : true)}
      aria-label={ariaLabel}
      role={role ?? (ariaLabel ? "status" : undefined)}
      {...rest}
    />
  );
}
