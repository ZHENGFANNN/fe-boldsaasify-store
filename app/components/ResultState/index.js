"use client";

import React from "react";
import Link from "next/link";
import styles from "./index.module.scss";

// 内置四种状态图标：只用 stroke，不填色，便于图标色随主题变。
const ICONS = {
  success: (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M8 12.4l2.6 2.6L16 9.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  info: (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M12 11v6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <circle cx="12" cy="7.8" r="1.1" fill="currentColor" />
    </svg>
  ),
  warning: (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 3.5 L21 19 H3 Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M12 10v4.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <circle cx="12" cy="17.2" r="1.1" fill="currentColor" />
    </svg>
  ),
  error: (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M9 9l6 6M15 9l-6 6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  ),
};

// 单个按钮：有 href 走 <Link>，否则 <button>。
function ActionButton({ action }) {
  const {
    label,
    onClick,
    href,
    target,
    rel,
    variant = "ghost",
    disabled = false,
    type = "button",
    ariaLabel,
  } = action;

  const cls =
    variant === "primary" ? styles.btn_primary : styles.btn_ghost;

  if (href && !disabled) {
    return (
      <Link
        href={href}
        target={target}
        rel={target === "_blank" ? rel || "noreferrer noopener" : rel}
        className={cls}
        aria-label={ariaLabel}
        onClick={onClick}
      >
        {label}
      </Link>
    );
  }

  return (
    <button
      type={type}
      className={cls}
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      aria-disabled={disabled || undefined}
    >
      {label}
    </button>
  );
}

/**
 * 通用结果态组件（成功 / 信息 / 警告 / 错误）。
 *
 * 用于提交完成、空结果引导、错误页兜底等"单页面唯一大事件"场景。
 * 视觉参考 Ant Design Result 与 Shopify Polaris EmptyState 的语义，
 * 但样式对齐商城克制风：圆形淡色底 icon + 深色主 CTA + 白底细边次按钮。
 *
 * @param {'success'|'info'|'warning'|'error'} status  状态，决定默认图标与配色，默认 success
 * @param {ReactNode} icon      自定义图标（覆盖 status 默认图标）
 * @param {ReactNode} title     标题（必填）
 * @param {ReactNode} description  描述（可选）
 * @param {Array<Action>} actions  按钮组，Action = { label, onClick?, href?, target?, rel?, variant?: 'primary'|'ghost', disabled?, ariaLabel? }
 * @param {ReactNode} extra     actions 上方的额外内容槽（如订单号、编号、状态标签）
 * @param {ReactNode} children  actions 下方的额外内容槽（如帮助链接、二维码）
 * @param {string} className    外层容器额外 class
 * @param {string} size         'default' | 'compact'，紧凑模式减小内边距（可选）
 */
export default function ResultState({
  status = "success",
  icon,
  title,
  description,
  actions = [],
  extra,
  children,
  className = "",
  size = "default",
}) {
  const iconNode = icon ?? ICONS[status] ?? ICONS.success;

  const rootCls = [
    styles.result,
    styles[`status_${status}`] || "",
    size === "compact" ? styles.compact : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className={rootCls}
      role="status"
      aria-live="polite"
      data-status={status}
    >
      <div className={styles.icon}>{iconNode}</div>

      {title ? <h2 className={styles.title}>{title}</h2> : null}
      {description ? <p className={styles.desc}>{description}</p> : null}

      {extra ? <div className={styles.extra}>{extra}</div> : null}

      {actions.length > 0 ? (
        <div className={styles.actions}>
          {actions.map((action, i) => (
            <ActionButton key={action.key ?? i} action={action} />
          ))}
        </div>
      ) : null}

      {children ? <div className={styles.children}>{children}</div> : null}
    </div>
  );
}
