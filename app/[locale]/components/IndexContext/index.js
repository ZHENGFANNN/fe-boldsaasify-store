"use client";
import React from "react";

export const IndexContent = React.createContext(null);

export default function IndexContext({
  children,
  CONFIG,
  LANG,
  goodDiscountFestival,
  goodSortList,
  locale,
  area,
}) {
  return (
    <IndexContent.Provider
      value={{
        CONFIG,
        LANG,
        goodDiscountFestival,
        goodSortList,
        locale,
        area,
      }}
    >
      {children}
    </IndexContent.Provider>
  );
}
