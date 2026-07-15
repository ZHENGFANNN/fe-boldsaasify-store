import React from "react";

export type PayDiscoverIconProps = React.SVGProps<SVGSVGElement>;

// Discover 卡面：白底 + 橙色圆点 + "DISCOVER" 字样。
export default function PayDiscoverIcon(props: PayDiscoverIconProps) {
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
      <circle cx="30" cy="15" r="4" fill="#F58220" />
      <text
        x="16"
        y="16"
        textAnchor="middle"
        fontFamily="Arial, Helvetica, sans-serif"
        fontWeight="700"
        fontSize="6.2"
        letterSpacing="0.3"
        fill="#000000"
      >
        DISCOVER
      </text>
    </svg>
  );
}
