"use client";

import React from "react";

/**
 * Icon —— 站点内联 SVG 图标库（外层通用组件）。
 *
 * 参考 DJI 官网导航的极简线性图标风格：24×24 视框、round 线帽/线接、
 * stroke=currentColor（颜色随父级 color / hover 变化，不依赖远程 svg 文件）。
 *
 * 用法：
 *   import { CartIcon, UserIcon } from "@/components/Icon";
 *   <CartIcon className={styles.icon} />
 *
 * 每个图标接收标准 svg props（className/style/width/height/onClick 等）透传，
 * 默认 width/height 由 CSS 控制（不写死尺寸，交给使用方样式）。
 */

// 通用底座：统一 viewBox / fill / stroke 约定，图标只需给 children 路径。
function IconBase({ children, size, className, strokeWidth = 1.6, ...rest }) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      {children}
    </svg>
  );
}

/**
 * CartIcon —— 购物车图标（DJI 风：细线购物袋/手提袋轮廓 + 双提手）。
 */
export function CartIcon(props) {
  return (
    <IconBase {...props}>
      {/* 袋身 */}
      <path d="M5.5 8.5h13l-1 11a1.5 1.5 0 0 1-1.5 1.4H8a1.5 1.5 0 0 1-1.5-1.4l-1-11Z" />
      {/* 双提手 */}
      <path d="M8.75 8.5v-1.25a3.25 3.25 0 0 1 6.5 0V8.5" />
    </IconBase>
  );
}

/**
 * UserIcon —— 用户/账户图标（DJI 风：细线头像，圆头 + 肩部弧）。
 */
export function UserIcon(props) {
  return (
    <IconBase {...props}>
      <circle cx="12" cy="8.5" r="3.75" />
      <path d="M5 20c0-3.4 3.1-5.75 7-5.75s7 2.35 7 5.75" />
    </IconBase>
  );
}

// 默认导出：图标集合，便于按名取用。
const Icon = { CartIcon, UserIcon };
export default Icon;
