import React from "react";

export type PayZhifubaoIconProps = React.SVGProps<SVGSVGElement>;

// 支付宝 Alipay 卡面：品牌蓝底 + 白色 "支" 字标（简化版）。
export default function PayZhifubaoIcon(props: PayZhifubaoIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="40"
      height="24"
      viewBox="0 0 40 24"
      aria-hidden="true"
      {...props}
    >
      <rect width="40" height="24" rx="3" fill="#1677FF" />
      <text
        x="12"
        y="17"
        textAnchor="middle"
        fontFamily="'PingFang SC', 'Microsoft YaHei', Arial, sans-serif"
        fontWeight="900"
        fontSize="12"
        fill="#FFFFFF"
      >
        支
      </text>
      <text
        x="26"
        y="16"
        textAnchor="middle"
        fontFamily="Arial, Helvetica, sans-serif"
        fontWeight="700"
        fontSize="6"
        letterSpacing="0.2"
        fill="#FFFFFF"
      >
        Alipay
      </text>
    </svg>
  );
}
