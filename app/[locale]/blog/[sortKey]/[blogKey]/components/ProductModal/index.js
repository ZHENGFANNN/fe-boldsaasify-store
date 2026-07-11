/** @format */
"use client";
import React from "react";
import ProductList from "./ProductList";
import styles from "./index.module.scss";

import Cookies from "js-cookie";
import Modal from "@/components/Modal";
import { debounce } from "@/utils";
import useProductsOffer from "@/hooks/useProductsOffer";

// 按地区把关联商品的 comboItem.areaList 解析成 areaInfo。
// 服务端不再按 cookie area 过滤（保持文章页整页可静态化），
// 选价下沉到此客户端组件。
function resolveAreaList(productList, area) {
  return (productList || []).map(({ comboItem, ...item }) => {
    let areaInfo = null;
    (comboItem?.areaList || []).forEach((a) => {
      if (a.country_code === area) areaInfo = a;
    });
    return { ...item, areaInfo };
  });
}

export default function ProductModal({
  LANG,
  locale,
  productList,
  // goodDiscountFestival,
}) {
  const modalRef = React.useRef(null);
  const [showTip, setShowTip] = React.useState(false);
  // 首屏用默认地区 us（与 SSR 一致），mount 后读 cookie 重算价格。
  const [area, setArea] = React.useState("us");
  React.useEffect(() => {
    const real = Cookies.get("area") || "us";
    if (real !== area) setArea(real);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const resolvedProductList = React.useMemo(
    () => resolveAreaList(productList, area),
    [productList, area]
  );

  // 关联产品自动折扣命中表（与详情页关联产品同口径），下发给 ProductList 算折后价。
  const { discountMap } = useProductsOffer(productList, { area, locale });

  React.useEffect(() => {
    // 每个Blog页面只出现一次弹窗
    const firstRenderTime = Date.now();
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
      /**
       * 同时满足以下条件时显示弹窗：
       * - 滚动到页面中间位置时
       * - 页面加载6s后（有相关BUG，Google不允许加载完，立刻有弹窗）
       */
      if (
        scrollTop + window.innerHeight / 2 > (bodyHeight * 1) / 2 &&
        Date.now() - firstRenderTime > 6000
      ) {
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
          products={resolvedProductList}
          discountMap={discountMap}
          LANG={LANG}
          // goodDiscountFestival={goodDiscountFestival}
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
