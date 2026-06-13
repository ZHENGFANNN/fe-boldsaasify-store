"use client";
import React from "react";
import GlobalContext from "@/[locale]/context";
import { useArea } from "@/hooks/useArea";

import CartModal from "./CartModal";
import AreaModal from "./AreaModal";
import ContactModal from "./ContactModal";
import CookieModal from "./CookieModal";
import LiveChat from "@/components/LiveChat";
import openLiveChat from "@/components/LiveChat/openLiveChat";

export default function Layout({
  locale,
  BLOG,
  LANG,
  CONFIG,
  PRODUCT,
  goodDiscountFestival,
  children,
}) {
  const { area, areaReady } = useArea();
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
  /**
   * 联系我们
   */
  const contactRef = React.useRef(null);
  return (
    <GlobalContext.Provider
      value={{
        // Config
        locale,
        area,
        areaReady,
        LANG,
        BLOG,
        CONFIG,
        PRODUCT,
        goodDiscountFestival,
        // ProductNum
        productNum,
        setProductNum,
        // Show Cart Modal
        showCartModal: () => {
          cartRef.current.show();
        },
        // Show Area Modal
        showAreaModal: () => {
          areaRef.current.show();
        },
        // Show Contact Modal
        showContactModal: () => {
          contactRef.current.show();
        },
        // Open live chat widget
        showLiveChat: (forceOpen = true) => {
          openLiveChat(forceOpen);
        },
      }}
    >
      {/* Cart Modal */}
      <CartModal ref={cartRef} />
      {/* Area Modal */}
      <AreaModal ref={areaRef} />
      {/* Contact Modal */}
      <ContactModal ref={contactRef} />
      {/* Cookie Modal */}
      <CookieModal />
      {/* Live Chat */}
      <LiveChat locale={locale} area={areaReady ? area || "us" : "us"} />
      {children}
    </GlobalContext.Provider>
  );
}
