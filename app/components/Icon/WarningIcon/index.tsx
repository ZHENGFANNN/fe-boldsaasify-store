import React from "react";

export type WarningIconProps = React.SVGProps<SVGSVGElement>;

/**
 * WarningIcon —— 与 SuccessIcon 同风格：24×24 满底色方块 + 白色符号，
 * 明亮琥珀底（#F5A623）+ 白色 "!"（竖线 + 底部圆点）。
 */
export default function WarningIcon(props: WarningIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      {...props}
    >
      <rect width="24" height="24" fill="#F5A623" />
      <path d="M12 6V15" stroke="#F3F2ED" strokeWidth="1.8" />
      <circle cx="12" cy="17.8" r="1.15" fill="#F3F2ED" />
    </svg>
  );
}
