import React from "react";

export type ShareFacebookIconProps = React.SVGProps<SVGSVGElement>;

export default function ShareFacebookIcon(props: ShareFacebookIconProps) {
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
      <rect width="26" height="26" rx="13" fill="#76767F" />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M10.2002 10.6067C10.1015 10.6067 10.0215 10.6867 10.0215 10.7854V12.6814C10.0215 12.7801 10.1015 12.8601 10.2002 12.8601H11.402V19.3011C11.402 19.3998 11.482 19.4798 11.5807 19.4798H13.8779C13.9766 19.4798 14.0566 19.3998 14.0566 19.3011V12.832H15.7451C15.8377 12.832 15.915 12.7612 15.9232 12.669L16.0887 10.8012C16.0979 10.6967 16.0155 10.6067 15.9106 10.6067H14.0566V9.33909C14.0566 8.8144 14.1623 8.60667 14.6693 8.60667H15.9271C16.0258 8.60667 16.1059 8.52664 16.1059 8.42792V6.47562C16.1059 6.3769 16.0258 6.29688 15.9271 6.29688H14.2679C12.2926 6.29688 11.402 7.16653 11.402 8.83206C11.402 10.2827 11.402 10.6067 11.402 10.6067H10.2002Z"
        fill="white"
      />
    </svg>
  );
}
