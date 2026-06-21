"use client";
import React from "react";

export const IndexContent = React.createContext(null);

// area 不再放进 context：消费方（IndexProductList 等）直接 useArea() 读 cookie，
// areaReady=false 时各组件自行渲染占位，避免 us→cn 货币闪动。
export default function IndexContext({
  children,
  CONFIG,
  LANG,
  goodsSortList,
  locale,
}) {
  return (
    <IndexContent.Provider
      value={{
        CONFIG,
        LANG,
        goodsSortList,
        locale,
      }}
    >
      {children}
    </IndexContent.Provider>
  );
}
