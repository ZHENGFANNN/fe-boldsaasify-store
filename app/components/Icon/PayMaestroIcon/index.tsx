import React from "react";

export type PayMaestroIconProps = React.SVGProps<SVGSVGElement>;

// Maestro 卡面：白底 + 蓝/红双圆交叠 + "maestro"。
export default function PayMaestroIcon(props: PayMaestroIconProps) {
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
      <circle cx="16.5" cy="10.5" r="5.5" fill="#0099DF" />
      <circle cx="23.5" cy="10.5" r="5.5" fill="#ED0006" fillOpacity="0.92" />
      <path
        d="M20 5.7a5.5 5.5 0 0 1 0 9.6 5.5 5.5 0 0 1 0-9.6Z"
        fill="#6C6BBD"
      />
      <text
        x="20"
        y="21"
        textAnchor="middle"
        fontFamily="Arial, Helvetica, sans-serif"
        fontWeight="700"
        fontSize="4.4"
        letterSpacing="0.1"
        fill="#111827"
      >
        maestro
      </text>
    </svg>
  );
}
