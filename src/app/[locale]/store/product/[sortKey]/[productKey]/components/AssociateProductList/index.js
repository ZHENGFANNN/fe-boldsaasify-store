"use client";

import React from "react";
import PcProductList from "./index.pc";
import MobProductList from "./index.mobile";
import ProductContext from "../../productContext";

export default function ProductList({ products, title }) {
  const [isMobile, setIsMobile] = React.useState(false);
  const { lazyLoading } = React.useContext(ProductContext);
  React.useEffect(() => {
    if (!lazyLoading) {
      setIsMobile($(window).width() < 1250);
      $(window).on("resize", () => {
        if ($(window).width() < 1250) {
          setIsMobile(true);
        } else {
          setIsMobile(false);
        }
      });
    }
  }, [lazyLoading]);
  return (
    <>
      {!isMobile ? (
        <PcProductList products={products} title={title} />
      ) : (
        <MobProductList products={products} title={title} />
      )}
    </>
  );
}
