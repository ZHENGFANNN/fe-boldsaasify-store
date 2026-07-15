import React from "react";

export type PayMasterIconProps = React.SVGProps<SVGSVGElement>;

// Mastercard 卡面：白底 + 红/橙双圆交叠。
export default function PayMasterIcon(props: PayMasterIconProps) {
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
      <circle cx="16.5" cy="12" r="6.5" fill="#EB001B" />
      <circle cx="23.5" cy="12" r="6.5" fill="#F79E1B" fillOpacity="0.9" />
      <path
        d="M20 6.8a6.5 6.5 0 0 1 0 10.4 6.5 6.5 0 0 1 0-10.4Z"
        fill="#FF5F00"
      />
    </svg>
  );
}
