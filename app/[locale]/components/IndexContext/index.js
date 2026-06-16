"use client";
import React from "react";
import Cookies from "js-cookie";

export const IndexContent = React.createContext(null);

// 首屏用默认地区 us 渲染（保证整页可静态化 / hydration 一致），
// mount 后读 area cookie 切到真实地区，IndexProductList 据此重算价格。
const DEFAULT_AREA = "us";

export default function IndexContext({
  children,
  CONFIG,
  LANG,
  goodSortList,
  locale,
}) {
  const [area, setArea] = React.useState(DEFAULT_AREA);
  React.useEffect(() => {
    setArea(Cookies.get("area") || DEFAULT_AREA);
  }, []);

  return (
    <IndexContent.Provider
      value={{
        CONFIG,
        LANG,
        goodSortList,
        locale,
        area,
      }}
    >
      {children}
    </IndexContent.Provider>
  );
}
