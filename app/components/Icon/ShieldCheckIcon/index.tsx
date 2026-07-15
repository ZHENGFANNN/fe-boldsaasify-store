import React from "react";

export type ShieldCheckIconProps = React.SVGProps<SVGSVGElement>;

export default function ShieldCheckIcon(props: ShieldCheckIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      fill="none"
      viewBox="0 0 20 20"
      aria-hidden="true"
      {...props}
    >
      <path
        d="M2 4.94328C2 4.49217 2.30203 4.09691 2.7373 3.9784L10.0038 2L17.2629 3.97827C17.6981 4.09686 18 4.49207 18 4.94309V8.64804C18 13.3452 14.7779 17.5152 10.0012 19C5.22316 17.5152 2 13.3443 2 8.64597V4.94328Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M6.25 9.58339L9.16667 12.5001L14.1667 7.50006"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
