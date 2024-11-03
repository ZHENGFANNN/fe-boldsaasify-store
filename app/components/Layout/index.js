/** @format */

"use client";
import React from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import GlobalContext from "../../[locale]/context";
import Cookies from "js-cookie";
import Api from "../../request";

import CartModal from "./CartModal";
import AreaModal from "./AreaModal";

export default function Layout({
  locale,
  area,
  BLOG,
  LANG,
  CONFIG,
  PRODUCT,
  goodDiscountFestival,
  children,
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  /**
   * 功能：处理全局数据
   * 数据：
   *  - 商品数量
   *  - 用户信息
   */
  //
  // 用户信息
  const [userInfo, setUserInfo] = React.useState(null);
  /**
   * 功能：用户鉴权
   * 作用：判断页面是否需要鉴权
   */
  React.useEffect(() => {
    if (userInfo) return;
    const token = Cookies.get("token");
    const asPath = `${pathname}${searchParams ? `?${searchParams}` : ""}`;
    // ***需要鉴权的URL列表***
    const tokenUrlList = ["/user/account"];
    const isTokenVailable = tokenUrlList.some((item) => {
      return pathname.endsWith(item);
    });

    if (token) {
      setUserInfo({ loading: true });
      Api.get(`/user/tokenLogin`)
        .then((res) => {
          if (res.code === 0) {
            setUserInfo(res.data);
          } else {
            throw new Error("code !== 0");
          }
        })
        .catch(() => {
          Cookies.remove("token");
          setUserInfo(null);
          if (isTokenVailable) {
            router.push(`/user/login?redirect=${asPath}`);
          }
        });
    } else {
      if (isTokenVailable) router.push(`/user/login?redirect=${asPath}`);
    }
  }, [pathname, searchParams, userInfo]);
  /**
   * 处理购物车数量
   */
  const cartRef = React.useRef(null);
  const [productNum, setProductNum] = React.useState(0);
  React.useEffect(() => {
    try {
      function handleStorageList() {
        const storeList = JSON.parse(localStorage.getItem("store_shopping"));
        let num = 0;
        if (typeof storeList === "object") {
          storeList.forEach((item) => {
            num = num + item.productNum;
          });
          setProductNum(num > 99 ? "99+" : num);
        }
      }
      handleStorageList();
      window.addEventListener("storage", handleStorageList);
      return () => {
        window.removeEventListener("storage", handleStorageList);
      };
    } catch {}
  }, []);
  /**
   * 地区选择器
   */
  const areaRef = React.useRef(null);

  return (
    <GlobalContext.Provider
      value={{
        // 配置数据
        locale,
        area,
        LANG,
        BLOG,
        CONFIG,
        PRODUCT,
        goodDiscountFestival,
        // 用户信息
        userInfo,
        setUserInfo,
        // 购物车数量
        productNum,
        setProductNum,
        // 展示购物车
        showCartModal: () => {
          cartRef.current.show();
        },
        // 展示地区选择器
        showAreaModal: () => {
          areaRef.current.show();
        },
      }}
    >
      {/* 购物车 */}
      <CartModal ref={cartRef} />
      {/* 地区选择 */}
      <AreaModal ref={areaRef} />
      {children}
    </GlobalContext.Provider>
  );
}
