import React from "react";

export type PayVisaIconProps = React.SVGProps<SVGSVGElement>;

// Visa 卡面：深蓝底 + 金色斜体 "VISA" 字标。
export default function PayVisaIcon(props: PayVisaIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="40"
      height="24"
      viewBox="0 0 40 24"
      aria-hidden="true"
      {...props}
    >
      <rect width="40" height="24" rx="3" fill="#1A1F71" />
      <text
        x="20"
        y="16.5"
        textAnchor="middle"
        fontFamily="Arial, Helvetica, sans-serif"
        fontWeight="900"
        fontStyle="italic"
        fontSize="10"
        letterSpacing="0.5"
        fill="#F7B600"
      >
        VISA
      </text>
    </svg>
  );
}
