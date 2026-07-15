import React from "react";

export type PayDinersClubsIconProps = React.SVGProps<SVGSVGElement>;

// Diners Club 卡面：白底 + 蓝圆 + "Diners"。
export default function PayDinersClubsIcon(props: PayDinersClubsIconProps) {
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
      <circle cx="14" cy="12" r="5.5" fill="#0079BE" />
      <path d="M14 8v8" stroke="#FFFFFF" strokeWidth="1.4" />
      <text
        x="26"
        y="14"
        textAnchor="middle"
        fontFamily="Arial, Helvetica, sans-serif"
        fontWeight="700"
        fontSize="5.5"
        fill="#0079BE"
      >
        Diners
      </text>
    </svg>
  );
}
