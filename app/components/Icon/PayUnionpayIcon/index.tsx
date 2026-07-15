import React from "react";

export type PayUnionpayIconProps = React.SVGProps<SVGSVGElement>;

// 银联 UnionPay 卡面：白底 + 蓝/白/红三色条 + "UnionPay"。
export default function PayUnionpayIcon(props: PayUnionpayIconProps) {
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
      <path d="M6 6h10v12H10a4 4 0 0 1-4-4V6Z" fill="#00447C" />
      <path d="M14 6h10v12h-6a4 4 0 0 1-4-4V6Z" fill="#E21836" />
      <path d="M22 6h12v8a4 4 0 0 1-4 4h-8V6Z" fill="#FFFFFF" />
      <text
        x="20"
        y="16"
        textAnchor="middle"
        fontFamily="Arial, Helvetica, sans-serif"
        fontWeight="800"
        fontSize="6"
        letterSpacing="0.2"
        fill="#111827"
      >
        UnionPay
      </text>
    </svg>
  );
}
