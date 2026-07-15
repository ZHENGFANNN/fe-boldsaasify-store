import React from "react";

export type MediaPlayIconProps = React.SVGProps<SVGSVGElement>;

export default function MediaPlayIcon(props: MediaPlayIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 1024 1024"
      fill="currentColor"
      aria-hidden="true"
      {...props}
    >
      <path
        fillOpacity=".85"
        fillRule="evenodd"
        d="M815.456414,568.245314 L361.495201,824.710618 C330.712165,842.101489 291.662866,831.239029 274.276151,800.448635 C268.850888,790.840955 266,779.993947 266,768.959678 L266,256.029069 C266,220.666791 294.659941,192 330.013769,192 C341.0454,192 351.889816,194.851569 361.495201,200.278129 L815.456414,456.743434 C846.23945,474.134304 857.099314,513.192937 839.712599,543.983331 C833.9845,554.127308 825.597966,562.515845 815.456414,568.245314 Z"
      />
    </svg>
  );
}
