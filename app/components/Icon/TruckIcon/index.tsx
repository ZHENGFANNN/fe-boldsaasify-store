import React from "react";

export type TruckIconProps = React.SVGProps<SVGSVGElement>;

export default function TruckIcon(props: TruckIconProps) {
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
        d="M1.66662 4.16675H12.2435C12.7746 4.16675 13.2051 4.53024 13.2051 5.11986V13.1351C13.2051 13.6835 12.7746 14.1667 12.2435 14.1667H2.49995C2.03971 14.1667 1.66662 13.7937 1.66662 13.3334V12.0834"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M19.1665 13.3334C19.1665 13.7936 18.7934 14.1667 18.3332 14.1667H14.1665C13.7063 14.1667 13.3332 13.7936 13.3332 13.3334V9.16674C13.3332 8.7065 13.7063 8.3334 14.1665 8.3334H15.924C16.1335 8.3334 16.3353 8.41231 16.4893 8.5544L18.8984 10.7782C19.0693 10.936 19.1665 11.158 19.1665 11.3906V13.3334Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M11.6667 15.0001C11.6667 15.9205 12.4129 16.6668 13.3333 16.6668C14.2538 16.6668 15 15.9205 15 15.0001"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M3.33317 15.0001C3.33317 15.9205 4.07938 16.6668 4.99984 16.6668C5.9203 16.6668 6.6665 15.9205 6.6665 15.0001"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M1.6665 7.0834H7.08317"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M1.6665 9.5834H7.08317"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
