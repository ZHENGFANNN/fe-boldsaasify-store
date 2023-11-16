import "../styles/globals.css";
import "../styles/reset.css";

import Navbar from "@/components/Layout/NavBar";
import Footer from "@/components/Layout/Footer";

import getGoodList from "@/utils/getGoodList";
import getConfigList from "@/utils/getConfigList";
import getLanguageList from "@/utils/getLanguageList";
import getGoodSortList from "@/utils/getGoodSortList";

import React from "react";

import useStore from "../globalStore";

export default async function RootLayout({ children }) {
  const [configList, languageList, goodSortList, goodList] = await Promise.all([
    getConfigList("en"),
    getLanguageList("en"),
    getGoodSortList("en"),
    getGoodList("en"),
  ]);

  // const { area } = useStore((state) => state.area);
  // console.log("area", area);
  /**
   * 功能：处理全局数据
   * 数据：
   *  - 商品数量
   *  - 用户信息
   */
  //
  // 用户信息
  // const [userInfo, setUserInfo] = React.useState(null);
  /**
   * 处理购物车数量
   */
  // const [productNum, setProductNum] = React.useState(0);
  // React.useEffect(() => {
  //   try {
  //     function handleStorageList() {
  //       const storeList = JSON.parse(localStorage.getItem("store_shopping"));
  //       let num = 0;
  //       if (typeof storeList === "object") {
  //         storeList.forEach((item) => {
  //           num = num + item.productNum;
  //         });
  //         setProductNum(num > 99 ? "99+" : num);
  //       }
  //     }
  //     handleStorageList();
  //     window.addEventListener("storage", handleStorageList);
  //     return () => {
  //       window.removeEventListener("storage", handleStorageList);
  //     };
  //   } catch {}
  // }, []);

  /**
   * 功能：用户鉴权
   * 作用：判断页面是否需要鉴权
   */
  // React.useEffect(() => {
  //   if (userInfo) return;
  //   const token = Cookies.get("token");
  //   const pathname = router.pathname;
  //   // ***需要鉴权的URL列表***
  //   const tokenUrlList = ["/user/account"];
  //   const isTokenVailable = tokenUrlList.some((item) =>
  //     pathname.endsWith(item)
  //   );
  //   if (token) {
  //     setUserInfo({ loading: true });
  //     Api.get(`/user/tokenLogin`)
  //       .then((res) => {
  //         if (res.code === 0) {
  //           setUserInfo(res.data);
  //         } else {
  //           throw new Error("code !== 0");
  //         }
  //       })
  //       .catch(() => {
  //         Cookies.remove("token");
  //         setUserInfo(null);
  //         if (isTokenVailable)
  //           router.push(`/user/login?redirect=${router.asPath}`);
  //       });
  //   } else {
  //     if (isTokenVailable) router.push(`/user/login?redirect=${router.asPath}`);
  //   }
  // }, [router, userInfo]);

  return (
    <html lang="en">
      <body>
        <Navbar
          LANG={languageList}
          CONFIG={configList}
          GOODLIST={goodList}
          GOODSORTLIST={goodSortList}
        />
        <div id="app-content">{children}</div>
        <Footer
          LANG={languageList}
          CONFIG={configList}
          GOODLIST={goodList}
          GOODSORTLIST={goodSortList}
        />
      </body>
    </html>
  );
}
