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
    goodDiscountFestival,
    isMobile,
    lazyLoading,
  } = React.useContext(ProductContext);
  const [device, setDevice] = React.useState(isMobile ? "mob" : "pc");
  React.useEffect(() => {
    if (!lazyLoading) {
      $(window).on("resize", () => {
        if ($(window).width() < 1250) {
          setDevice("mob");
        } else {
          setDevice("pc");
        }
      });
    }
  }, [lazyLoading]);
  if (associateProduct.length < 1) return null;
  return (
    <>
      {device === "pc" ? (
        <PcProductList
          LANG={LANG}
          goodDiscountFestival={goodDiscountFestival}
          products={associateProduct}
        />
      ) : (
        <MobProductList
          LANG={LANG}
          goodDiscountFestival={goodDiscountFestival}
          products={associateProduct}
        />
      )}
    </>
  );
}
