"use client";
import React from "react";

export const IndexContent = React.createContext(null);

// HomeContent 别名：首页模块化（*Module 组件）统一引 HomeContent；
// 老组件（IndexBanner / IndexProductList）继续引 IndexContent，零改动。
// 两者是同一个 context 对象，故 Provider 一次下发、两边都能取到（含新增的 categoryList/blogList）。
export const HomeContent = IndexContent;

// area 不再放进 context：消费方（IndexProductList 等）直接 useArea() 读 cookie，
// areaReady=false 时各组件自行渲染占位，避免 us→cn 货币闪动。
//
// categoryList / bestSellers / bestSellersTag / blogList 为首页模块新增字段：
// /product 页只用 goodsSortList，不传这几项 → 对应模块不在该页渲染，无影响。
export default function IndexContext({
  children,
  CONFIG,
  LANG,
  goodsSortList,
  categoryList,
  bestSellers,
  bestSellersTag,
  blogList,
  locale,
}) {
  return (
    <IndexContent.Provider
      value={{
        CONFIG,
        LANG,
        goodsSortList,
        categoryList,
        bestSellers,
        bestSellersTag,
        blogList,
        locale,
      }}
    >
      {children}
    </IndexContent.Provider>
  );
}
