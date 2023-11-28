"use client";
import React from "react";
import {
  useRouter,
  usePathname,
  useSearchParams,
  useParams,
} from "next/navigation";
import GlobalContext from "@/globalContext";
import Cookies from "js-cookie";
import Api from "@/api";
import Script from "next/script";

export default function Layout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { locale } = useParams();
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
    console.log("searchParams", pathname);
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
  const [productNum, setProductNum] = React.useState(0);
  React.useEffect(() => {
    try {
      function handleStorageList() {
        const storeList = JSON.parse(localStorage.getItem("store_shopping"));
        let num = 0;
        if (typeof storeList === "object") {
          console.log("storeList", storeList);
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

  return (
    <GlobalContext.Provider
      value={{
        // 用户信息
        userInfo,
        setUserInfo,
        // 购物车数量
        productNum,
        setProductNum,
        // 语言
        locale,
      }}
    >
      {/* 谷歌GTM */}
      <noscript>
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
      {/* Facebook */}
      <noscript>
        <img
          height="1"
          width="1"
          style={{ display: "none" }}
          src="https://www.facebook.com/tr?id=335583322299675&ev=PageView&noscript=1"
        />
      </noscript>
      {/* 谷歌 - GTM */}
      {/* <script
        async
        src="https://www.googletagmanager.com/gtag/js?id=G-HXTW7Y9DD3"
      ></script> */}
      <Script
        id="google-gtm"
        dangerouslySetInnerHTML={{
          __html: `window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-HXTW7Y9DD3');`,
        }}
      />
      {/* Facebook - Fixed */}
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
            fbq('init', '335583322299675');
            fbq('track', 'PageView');`,
        }}
      />
      {children}
    </GlobalContext.Provider>
  );
}
