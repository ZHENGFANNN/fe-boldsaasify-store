import React from "react";

export type PayWechatIconProps = React.SVGProps<SVGSVGElement>;

// 微信支付 WeChat Pay 卡面：绿底 + 白色气泡对话 + "WeChat Pay"。
export default function PayWechatIcon(props: PayWechatIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="40"
      height="24"
      viewBox="0 0 40 24"
      aria-hidden="true"
      {...props}
    >
      <rect width="40" height="24" rx="3" fill="#09BB07" />
      <path
        d="M11.5 7c-2.8 0-5 1.9-5 4.3 0 1.4.7 2.6 1.9 3.4l-.5 1.5 1.8-.9c.6.2 1.2.3 1.8.3.2 0 .3 0 .5 0-.1-.3-.1-.6-.1-.9 0-2.2 2-3.9 4.6-3.9.1 0 .3 0 .4 0C15.5 8.5 13.7 7 11.5 7ZM9.8 10.6a.7.7 0 1 1 0-1.4.7.7 0 0 1 0 1.4Zm3.5 0a.7.7 0 1 1 0-1.4.7.7 0 0 1 0 1.4Z"
        fill="#FFFFFF"
      />
      <path
        d="M20.4 11c-2.4 0-4.4 1.6-4.4 3.7 0 2 2 3.7 4.4 3.7.5 0 1 0 1.4-.2l1.5.8-.4-1.3c1.1-.7 1.8-1.7 1.8-2.9 0-2.1-1.9-3.8-4.3-3.8Zm-1.4 3.1a.6.6 0 1 1 0-1.2.6.6 0 0 1 0 1.2Zm2.9 0a.6.6 0 1 1 0-1.2.6.6 0 0 1 0 1.2Z"
        fill="#FFFFFF"
      />
      <text
        x="32"
        y="15"
        textAnchor="middle"
        fontFamily="Arial, Helvetica, sans-serif"
        fontWeight="700"
        fontSize="5"
        fill="#FFFFFF"
      >
        Pay
      </text>
    </svg>
  );
}
