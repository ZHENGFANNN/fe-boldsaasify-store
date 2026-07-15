import React from "react";

export type MenuIconProps = React.SVGProps<SVGSVGElement>;

export default function MenuIcon(props: MenuIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="40"
      height="40"
      fill="none"
      viewBox="0 0 40 40"
      aria-hidden="true"
      {...props}
    >
      <rect fill="#f6f7fa" height="40" rx="8" width="40" />
      <g fill="#b6b6c0">
        <rect height="1.59375" rx=".796875" width="17" x="11.499" y="13.1094" />
        <rect height="1.59375" rx=".796875" width="17" x="11.499" y="18.9531" />
        <rect height="1.59375" rx=".796875" width="17" x="11.499" y="24.7969" />
      </g>
    </svg>
  );
}
