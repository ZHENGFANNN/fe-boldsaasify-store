import React from "react";

export type PayTransferIconProps = React.SVGProps<SVGSVGElement>;

// 银行转账卡面：浅灰底 + 银行/建筑图标（柱廊 + 三角屋顶）。
export default function PayTransferIcon(props: PayTransferIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="40"
      height="24"
      viewBox="0 0 40 24"
      aria-hidden="true"
      {...props}
    >
      <rect width="40" height="24" rx="3" fill="#F3F4F6" stroke="#E5E7EB" />
      <path
        d="M20 5.5 12 10h16L20 5.5Z"
        fill="#374151"
      />
      <rect x="12" y="10.5" width="16" height="1.2" fill="#374151" />
      <rect x="13.5" y="12" width="1.6" height="5" fill="#374151" />
      <rect x="17" y="12" width="1.6" height="5" fill="#374151" />
      <rect x="20.5" y="12" width="1.6" height="5" fill="#374151" />
      <rect x="24" y="12" width="1.6" height="5" fill="#374151" />
      <rect x="12" y="17.4" width="16" height="1.4" rx="0.3" fill="#374151" />
    </svg>
  );
}
