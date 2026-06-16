/** @format */

"use client";

import React from "react";
import ProductContext from "../../ProductContext";

import PcProductList from "./index.pc";
import MobProductList from "./index.mobile";

export default function AssociateProductList() {
  const {
    LANG,
    productInfo: { associateProduct },
    // goodDiscountFestival,
    isMobile,
    lazyLoading,
  } = React.useContext(ProductContext);
  const [device, setDevice] = React.useState(isMobile ? "mob" : "pc");
  React.useEffect(() => {
    if (!lazyLoading) {
      // 整页静态化后 SSR 不再判设备，挂载时先按实际宽度纠正一次，再监听 resize。
      const sync = () => setDevice($(window).width() < 1250 ? "mob" : "pc");
      sync();
      $(window).on("resize", sync);
      return () => $(window).off("resize", sync);
    }
  }, [lazyLoading]);
  if (!Array.isArray(associateProduct) || associateProduct.length < 1) return null;
  return (
    <>
      {device === "pc" ? (
        <PcProductList
          LANG={LANG}
          // goodDiscountFestival={goodDiscountFestival}
          products={associateProduct}
        />
      ) : (
        <MobProductList
          LANG={LANG}
          // goodDiscountFestival={goodDiscountFestival}
          products={associateProduct}
        />
      )}
    </>
  );
}
