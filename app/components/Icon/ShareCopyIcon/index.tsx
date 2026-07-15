import React from "react";

export type ShareCopyIconProps = React.SVGProps<SVGSVGElement>;

export default function ShareCopyIcon(props: ShareCopyIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="26"
      height="26"
      viewBox="0 0 26 26"
      fill="none"
      aria-hidden="true"
      {...props}
    >
      <circle cx="13" cy="13" r="13" fill="#76767F" />
      <path
        d="M13.7333 12.267C14.5263 13.06 14.5147 14.3575 13.7072 15.165L10.3653 18.5069C9.55779 19.3144 8.26029 19.3261 7.46722 18.533C6.67416 17.74 6.68585 16.4425 7.49333 15.635L10.2086 12.9197"
        stroke="white"
        strokeWidth="1.12308"
        strokeLinecap="round"
      />
      <path
        d="M12.267 13.733C11.474 12.9399 11.4856 11.6424 12.2931 10.8349L15.635 7.49302C16.4425 6.68554 17.74 6.67385 18.5331 7.46691C19.3261 8.25998 19.3145 9.55748 18.507 10.365L15.7917 13.0803"
        stroke="white"
        strokeWidth="1.12308"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
