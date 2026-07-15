import React from "react";

export type PayJcbIconProps = React.SVGProps<SVGSVGElement>;

// JCB 卡面：白底 + 蓝/红/绿三色条 + "JCB"。
export default function PayJcbIcon(props: PayJcbIconProps) {
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
      <rect x="10" y="6" width="6" height="12" rx="1.5" fill="#0072BC" />
      <rect x="17" y="6" width="6" height="12" rx="1.5" fill="#E1000F" />
      <rect x="24" y="6" width="6" height="12" rx="1.5" fill="#00A651" />
      <text
        x="13"
        y="15"
        textAnchor="middle"
        fontFamily="Arial, Helvetica, sans-serif"
        fontWeight="800"
        fontSize="5.6"
        fill="#FFFFFF"
      >
        J
      </text>
      <text
        x="20"
        y="15"
        textAnchor="middle"
        fontFamily="Arial, Helvetica, sans-serif"
        fontWeight="800"
        fontSize="5.6"
        fill="#FFFFFF"
      >
        C
      </text>
      <text
        x="27"
        y="15"
        textAnchor="middle"
        fontFamily="Arial, Helvetica, sans-serif"
        fontWeight="800"
        fontSize="5.6"
        fill="#FFFFFF"
      >
        B
      </text>
    </svg>
  );
}
