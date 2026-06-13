"use client";

import styles from "./index.module.scss";

/**
 * 通用 shimmer 占位块，尺寸与布局由调用方 className / style 控制。
 * @param {"text" | "rect" | "circular"} variant
 */
export default function Skeleton({
  variant = "text",
  className = "",
  style,
  width,
  height,
  "aria-hidden": ariaHidden,
  "aria-label": ariaLabel,
  role,
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
