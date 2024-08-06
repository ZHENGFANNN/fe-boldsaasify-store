/** @format */
"use client";
import Modal from "@/components/Modal";
import React from "react";
import ProductList from "./ProductList";
import styles from "./index.module.scss";
import { debounce } from "@/utils";

export default function ProductModal({
  LANG,
  productList,
  goodDiscountFestival,
}) {
  const modalRef = React.useRef(null);
  const [showTip, setShowTip] = React.useState(false);

  React.useEffect(() => {
    // 每个Blog页面只出现一次弹窗
    const storageKey = `blog:show-product:${window.location.pathname}`;
    if (localStorage.getItem(storageKey)) {
      setShowTip(true);
      return;
    }

    let timer = null;
    const bodyHeight = document.body.offsetHeight;
    const scrollEvent = debounce(function () {
      const scrollTop =
        document.body.scrollTop || document.documentElement.scrollTop;
      if (scrollTop + window.innerHeight / 2 > (bodyHeight * 1) / 2) {
        modalRef.current.show({
          title: LANG["store.blog_index.related_products"],
        });
        localStorage.setItem(storageKey, "true");
        window.removeEventListener("scroll", scrollEvent);
        clearTimeout(timer);
      }
    });
    timer = setTimeout(() => {
      modalRef.current.show({
        title: LANG["store.blog_index.related_products"],
      });
      localStorage.setItem(storageKey, "true");
      window.removeEventListener("scroll", scrollEvent);
    }, 30000);
    window.addEventListener("scroll", scrollEvent);
    return () => {
      window.removeEventListener("scroll", scrollEvent);
      clearTimeout(timer);
    };
  }, []);

  return (
    <>
      <Modal ref={modalRef} onClose={() => setShowTip(true)}>
        <ProductList
          products={productList}
          LANG={LANG}
          goodDiscountFestival={goodDiscountFestival}
        />
      </Modal>
      <div
        data-active={showTip}
        className={styles.associate_product_tip}
        onClick={() => {
          modalRef.current.show({
            title: LANG["store.blog_index.related_products"],
          });
          setShowTip(false);
        }}
      >
        {LANG["store.blog_index.related_products"]}
      </div>
    </>
  );
}
