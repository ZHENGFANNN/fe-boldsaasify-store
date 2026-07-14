import React from "react";

export type SuccessIconProps = React.SVGProps<SVGSVGElement>;

export default function SuccessIcon(props: SuccessIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      {...props}
    >
      <rect width="24" height="24" fill="#00D9A5" />
      <path
        d="M7 10.8751L11.0619 14.6369L17.5084 8"
        stroke="#F3F2ED"
        strokeWidth="1.8"
      />
    </svg>
  );
}
