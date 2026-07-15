import React from "react";

export type PayPaypalIconProps = React.SVGProps<SVGSVGElement>;

// PayPal 卡面：白底 + 双色 "PayPal" 字标（Pay 深蓝 / Pal 浅蓝）。
export default function PayPaypalIcon(props: PayPaypalIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="40"
      height="24"
      viewBox="0 0 40 24"
      aria-hidden="true"
      {...props}
    >
      <rect width="40" height="24" rx="3" fill="#FFFFFF" stroke="#E5E7EB" />
      <text
        x="8"
        y="16"
        fontFamily="Arial, Helvetica, sans-serif"
        fontWeight="800"
        fontStyle="italic"
        fontSize="9.5"
        letterSpacing="-0.3"
      >
        <tspan fill="#003087">Pay</tspan>
        <tspan fill="#009CDE">Pal</tspan>
      </text>
    </svg>
  );
}
