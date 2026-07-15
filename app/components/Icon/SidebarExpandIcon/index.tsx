import React from "react";

export type SidebarExpandIconProps = React.SVGProps<SVGSVGElement>;

export default function SidebarExpandIcon(props: SidebarExpandIconProps) {
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
      <g clipRule="evenodd" fill="#b6b6c0" fillRule="evenodd">
        <path d="m25.7864 14.2225c.2878.2939.2846.7672-.0071 1.0572l-4.7485 4.7203 4.7485 4.7203c.2917.2899.2949.7632.0071 1.0571-.2878.294-.7575.2972-1.0492.0072l-5.2839-5.2524c-.1413-.1405-.2209-.3322-.2209-.5322s.0796-.3917.2209-.5322l5.2839-5.2524c.2917-.29.7614-.2868 1.0492.0071z" />
        <path d="m19.554 14.2225c.2877.2939.2846.7672-.0071 1.0572l-4.7486 4.7203 4.7486 4.7203c.2917.2899.2948.7632.0071 1.0571-.2878.294-.7576.2972-1.0493.0072l-5.2838-5.2524c-.1414-.1405-.2209-.3322-.2209-.5322s.0795-.3917.2209-.5322l5.2838-5.2524c.2917-.29.7615-.2868 1.0493.0071z" />
      </g>
    </svg>
  );
}
