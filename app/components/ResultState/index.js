"use client";

import React from "react";
import SuccessIcon from "@/components/Icon/SuccessIcon";
import WarningIcon from "@/components/Icon/WarningIcon";
import ErrorIcon from "@/components/Icon/ErrorIcon";
import Button from "@/components/Button";
import styles from "./index.module.scss";

// 内置三种状态图标：24×24 同风格方块底 + 白色符号，图标自带底色，无需外层圆底。
const ICONS = {
  success: <SuccessIcon width={64} height={64} />,
  warning: <WarningIcon width={64} height={64} />,
  error: <ErrorIcon width={64} height={64} />
};

// 单个按钮：视觉与交互由公共 Button 承担；href/onClick/loading 等自动透传。
function ActionButton({ action }) {
  const {
    label,
    onClick,
    href,
    target,
    rel,
    variant = "ghost",
    disabled = false,
    loading = false,
    spinning = false,
    type = "button",
    ariaLabel
  } = action;

  return (
    <Button
      variant={variant}
      href={href}
      target={target}
      rel={rel}
      type={type}
      onClick={onClick}
      disabled={disabled}
      loading={loading}
      spinning={spinning}
      aria-label={ariaLabel}
    >
      {label}
    </Button>
  );
}

/**
 * 通用结果态组件（成功 / 信息 / 警告 / 错误）。
 *
 * 用于提交完成、空结果引导、错误页兜底等"单页面唯一大事件"场景。
 * 视觉参考 Ant Design Result 与 Shopify Polaris EmptyState 的语义，
 * 但样式对齐商城克制风：圆形淡色底 icon + 深色主 CTA + 白底细边次按钮。
 *
 * @param {'success'|'warning'|'error'} status  状态，决定默认图标与配色，默认 success
 * @param {ReactNode} icon      自定义图标（覆盖 status 默认图标）
 * @param {ReactNode} title     标题（必填）
 * @param {ReactNode} description  描述（可选）
 * @param {Array<Action>} actions  按钮组，Action = { label, onClick?, href?, target?, rel?, variant?: 'primary'|'secondary'|'ghost', disabled?, loading?, spinning?, type?, ariaLabel?, key? }
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
  size = "default"
}) {
  const iconNode = icon ?? ICONS[status] ?? ICONS.success;

  const rootCls = [
    styles.result,
    styles[`status_${status}`] || "",
    size === "compact" ? styles.compact : "",
    className
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={styles.container}>
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
    </div>
  );
}
