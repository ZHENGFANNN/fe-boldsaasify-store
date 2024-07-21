/** @format */
"use client";
import Modal from "@/components/Modal";
import React from "react";
import ProductList from "./ProductList";

export default function ProductModal({
  LANG,
  productList,
  goodDiscountFestival,
}) {
  const modalRef = React.useRef(null);
  React.useEffect(() => {
    setTimeout(() => {
      if (modalRef.current) {
        modalRef.current.show({ title: "产品推荐" });
      }
    }, 3000);
  }, []);
  return (
    <Modal ref={modalRef}>
      <ProductList
        products={productList}
        LANG={LANG}
        goodDiscountFestival={goodDiscountFestival}
      />
    </Modal>
  );
}
