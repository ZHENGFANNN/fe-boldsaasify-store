import React from "react";

export type ShareXIconProps = React.SVGProps<SVGSVGElement>;

export default function ShareXIcon(props: ShareXIconProps) {
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
      <circle cx="12" cy="12" r="12" fill="#767680" />
      <path
        d="M13.4028 11.0238L18.0273 5.625H16.9314L12.916 10.3127L9.70882 5.625H6.00977L10.8596 12.7136L6.00977 18.375H7.10569L11.3461 13.4247L14.7331 18.375H18.4321L13.4025 11.0238H13.4028ZM11.9018 12.776L11.4104 12.0702L7.50056 6.45355H9.18384L12.3391 10.9863L12.8305 11.6922L16.9319 17.5841H15.2487L11.9018 12.7763V12.776Z"
        fill="white"
      />
    </svg>
  );
}
