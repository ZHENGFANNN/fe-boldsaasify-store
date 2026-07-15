import React from "react";

export type PayAmericanExpressIconProps = React.SVGProps<SVGSVGElement>;

// American Express 卡面：品牌蓝底 + 白色 "AMEX" 字标。
export default function PayAmericanExpressIcon(
  props: PayAmericanExpressIconProps,
) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="40"
      height="24"
      viewBox="0 0 40 24"
      aria-hidden="true"
      {...props}
    >
      <rect width="40" height="24" rx="3" fill="#2E77BB" />
      <text
        x="20"
        y="16.5"
        textAnchor="middle"
        fontFamily="Arial, Helvetica, sans-serif"
        fontWeight="900"
        fontSize="9"
        letterSpacing="0.4"
        fill="#FFFFFF"
      >
        AMEX
      </text>
    </svg>
  );
}
