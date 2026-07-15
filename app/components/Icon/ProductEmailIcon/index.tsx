import React from "react";

export type ProductEmailIconProps = React.SVGProps<SVGSVGElement>;

export default function ProductEmailIcon(props: ProductEmailIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="36"
      height="36"
      viewBox="0 0 1024 1024"
      fill="none"
      stroke="currentColor"
      strokeWidth={72}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <rect x="80" y="224" width="864" height="576" rx="72" />
      <polyline points="80,272 512,552 944,272" />
    </svg>
  );
}
