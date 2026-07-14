"use client";

import React from "react";
import Link from "next/link";
import Skeleton from "@/components/Skeleton";
import styles from "./index.module.scss";

/**
 * 通用按钮 —— 覆盖登录/注册/结账入口/表单提交等多处使用场景。
 *
 * 主题（variant）：
 *   - "primary"    深色主按钮（黑底白字，pill 圆角），示例：登录/注册/找回密码提交按钮
 *   - "secondary"  浅灰次按钮（浅灰底深字），示例：结账页 Log in 邮箱入口
 *   - "ghost"      白底细描边（白底 + 深字 + 灰边），示例：结账页 Register 邮箱入口
 *
 * 尺寸（size）：
 *   - "default"    高 48px（桌面），移动端会略缩到 44px
 *   - "small"      高 40px
 *
 * 加载态：
 *   - loading      业务动作进行中——按钮 disabled、显示旋转 Spinner + 原 label
 *   - spinning     数据加载中——用 Skeleton shimmer 撑满按钮，屏蔽点击（视觉占位）
 *
 * 渲染元素：
 *   - 提供 href 时渲染 <Link>（走 next 客户端导航；loading/spinning/disabled 时降级为 <span>）
 *   - 否则渲染 <button>
 *
 * 常用 props（其余透传给底层元素）：
 *   variant, size, block, loading, spinning, disabled,
 *   type ('button'|'submit'|'reset', 仅 <button>),
 *   href, target, rel (仅 <Link>),
 *   onClick, className, children
 */
export default function Button({
  variant = "primary",
  size = "default",
  block = false,
  loading = false,
  spinning = false,
  disabled = false,
  type = "button",
  href,
  target,
  rel,
  onClick,
  className = "",
  children,
  "aria-label": ariaLabel,
  ...rest
}) {
  const isInactive = disabled || loading || spinning;

  const rootCls = [
    styles.btn,
    styles[`variant_${variant}`] || styles.variant_primary,
    styles[`size_${size}`] || styles.size_default,
    block ? styles.block : "",
    isInactive ? styles.inactive : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  // spinning：用 Skeleton 撑满按钮做占位，屏蔽 label 与点击
  const inner = spinning ? (
    <span className={styles.skeleton_wrap} aria-hidden="true">
      <Skeleton
        variant="rect"
        className={styles.skeleton_fill}
        aria-hidden="true"
      />
    </span>
  ) : (
    <>
      {loading ? (
        <span className={styles.spinner} aria-hidden="true">
          <svg viewBox="0 0 24 24" className={styles.spinner_svg}>
            <circle
              cx="12"
              cy="12"
              r="9"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeDasharray="42 100"
            />
          </svg>
        </span>
      ) : null}
      <span className={styles.label}>{children}</span>
    </>
  );

  // href 有值 → 渲染链接；loading/spinning/disabled 时降级为 <span> 阻断点击
  if (href) {
    if (isInactive) {
      return (
        <span
          className={rootCls}
          aria-disabled="true"
          aria-busy={loading || spinning || undefined}
          aria-label={ariaLabel}
          role="link"
          {...rest}
        >
          {inner}
        </span>
      );
    }
    return (
      <Link
        href={href}
        target={target}
        rel={target === "_blank" ? rel || "noreferrer noopener" : rel}
        className={rootCls}
        onClick={onClick}
        aria-label={ariaLabel}
        {...rest}
      >
        {inner}
      </Link>
    );
  }

  return (
    <button
      type={type}
      className={rootCls}
      disabled={isInactive || undefined}
      aria-disabled={isInactive || undefined}
      aria-busy={loading || spinning || undefined}
      aria-label={ariaLabel}
      onClick={isInactive ? undefined : onClick}
      {...rest}
    >
      {inner}
    </button>
  );
}
