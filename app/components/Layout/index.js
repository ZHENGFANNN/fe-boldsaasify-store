/** @format */

"use client";
import React from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import GlobalContext from "../../[locale]/context";
import Cookies from "js-cookie";
import Api from "../../request";
import Script from "next/script";

import SmartsUpp from "./Customer/SmartsUpp";
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
      {/* <noscript>
        <iframe
          src="https://www.googletagmanager.com/ns.html?id=GTM-KPTW2T7S"
          height="0"
          width="0"
          style={{
            display: "none",
            visibility: "hidden",
          }}
        ></iframe>
      </noscript>
      <noscript>
        <img
          height="1"
          width="1"
          style={{ display: "none" }}
          src="https://www.facebook.com/tr?id=391873080113365&ev=PageView&noscript=1"
        />
      </noscript>
      <script
        async
        src="https://www.googletagmanager.com/gtag/js?id=G-HXTW7Y9DD3"
      ></script>
      <Script
        id="google-gtm"
        dangerouslySetInnerHTML={{
          __html: `window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-HXTW7Y9DD3');`,
        }}
      />
      <Script
        id="facebook-fixed"
        dangerouslySetInnerHTML={{
          __html: `!function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '391873080113365');
            `,
        }}
      /> */}
      {children}
      <SmartsUpp />
    </GlobalContext.Provider>
  );
}
