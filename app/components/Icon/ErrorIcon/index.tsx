import React from "react";

export type ErrorIconProps = React.SVGProps<SVGSVGElement>;

/**
 * ErrorIcon —— 与 SuccessIcon 同风格：24×24 满底色方块 + 白色符号，
 * 亮红底（#F0623F）+ 白色 "×"（两条对角线）。
 */
export default function ErrorIcon(props: ErrorIconProps) {
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
      <rect width="24" height="24" fill="#F0623F" />
      <path
        d="M8 8L16 16M16 8L8 16"
        stroke="#F3F2ED"
        strokeWidth="1.8"
      />
    </svg>
  );
}
