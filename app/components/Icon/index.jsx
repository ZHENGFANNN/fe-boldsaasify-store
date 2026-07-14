/**
 * Icon —— 站点内联 SVG 图标库入口。
 *
 * 各图标组件维护在同级子目录（如 ./CartIcon、./UserIcon），
 * 此文件仅做具名 + 默认导出的转发，方便按名取用：
 *   import { CartIcon, UserIcon } from "@/components/Icon";
 */

import CartIcon from "./CartIcon";
import UserIcon from "./UserIcon";
import GlobalIcon from "./GlobalIcon";
import SuccessIcon from "./SuccessIcon";
import WarningIcon from "./WarningIcon";
import ErrorIcon from "./ErrorIcon";

export {
  CartIcon,
  UserIcon,
  GlobalIcon,
  SuccessIcon,
  WarningIcon,
  ErrorIcon,
};

const Icon = {
  CartIcon,
  UserIcon,
  GlobalIcon,
  SuccessIcon,
  WarningIcon,
  ErrorIcon,
};
export default Icon;
