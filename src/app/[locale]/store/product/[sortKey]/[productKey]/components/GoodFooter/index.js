"use client";

import React from "react";
import styles from "./index.module.scss";
import useProductStore from "../../productStore";
import ProductContext from "../../productContext";
import tracking from "../../tracking";
import { useRouter, useSearchParams } from "next/navigation";

export default function GoodFooter({
  LANG,
  productInfo,
  goodDiscountFestival,
}) {
  const { lazyLoading } = React.useContext(ProductContext);
  const productNum = useProductStore((state) => state.productNum);
  const productOptions = useProductStore((state) => state.productOptions);
  const productCurCombo = useProductStore((state) => state.productCurCombo);
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderPage = searchParams.get("order_page");

  // Footer处理
  React.useEffect(() => {
    if (!lazyLoading) {
      const $footerDom = $('[data-role="footer-buy"]');
      // 计算底部位置
      const height = $footerDom.outerHeight();
      $("[data-role='footer-info']").css({
        paddingBottom: height,
      });
      // 埋点 - 查看次数
      tracking.viewContent({
        productName: productInfo.key,
      });

      // 滚动展示底部位置
      const $btnDom = $('[data-role="buy-btn-list"]').eq(0);
      function computedFooterBottom() {
        const btnTop = $btnDom.offset()?.top;
        if (btnTop) {
          const scrollTop = $(document).scrollTop();
          if (scrollTop > btnTop) {
            $footerDom.css({
              bottom: 0,
            });
          } else {
            $footerDom.css({
              bottom: "-100%",
            });
          }
        } else {
          $footerDom.css({
            bottom: 0,
          });
        }
      }
      computedFooterBottom();
      $(window).on("scroll", () => computedFooterBottom());
      return () => {
        $(window).off("scroll", () => computedFooterBottom());
        $("[data-role='footer-info']").css({
          paddingBottom: 0,
        });
      };
    }
  }, [lazyLoading]);

  return (
    <section data-role="footer-buy" className={styles.footer_container}>
      {/* 底部 - 加入购物车 */}
      <div className={styles.footer_content}>
        <div className={styles.footer_left}>
          <h3>
            {productInfo.name}{" "}
            {productNum > 1 ? <span>{` × ${productNum}`}</span> : null}
          </h3>
          <div className={styles.express_time}>
            <img
              alt="express"
              src={`${process.env.NEXT_PUBLIC_IMAGE}/icon/min-express.png`}
            />
            <span
              dangerouslySetInnerHTML={{
                __html: LANG["store.product.deliver_time"]
                  ?.split("${1}")
                  ?.join("7"),
              }}
            />
          </div>
        </div>
        <div className={styles.footer_right}>
          <div className={styles.footer_price}>
            {productCurCombo.areaInfo?.price ? (
              <div className={styles.price}>
                {goodDiscountFestival &&
                productCurCombo.areaInfo.good_discount ? (
                  <div>{`${productCurCombo.areaInfo.currency_symbol}${
                    productCurCombo.areaInfo.currency
                  } ${
                    Math.floor(
                      productCurCombo.areaInfo.price *
                        productCurCombo.areaInfo.good_discount *
                        0.01
                    ) * productNum
                  }`}</div>
                ) : null}
                <div>{`${productCurCombo.areaInfo.currency_symbol}${
                  productCurCombo.areaInfo.currency
                } ${productCurCombo.areaInfo.price * productNum}`}</div>
              </div>
            ) : null}
            {goodDiscountFestival && productCurCombo.areaInfo.good_discount ? (
              <div className={styles.save_price}>
                -{" "}
                {`${productCurCombo.areaInfo.currency_symbol}${
                  productCurCombo.areaInfo.currency
                } ${
                  Math.ceil(
                    (100 - productCurCombo.areaInfo.good_discount) *
                      0.01 *
                      productCurCombo.areaInfo.price
                  ) * productNum
                }`}
              </div>
            ) : null}
          </div>
          <div
            onClick={() => {
              if (
                !productCurCombo?.areaInfo?.price ||
                !productCurCombo?.areaInfo?.stock
              )
                return;
              let cartList = window.localStorage.getItem("store_shopping");
              try {
                cartList = JSON.parse(cartList) ?? [];
              } catch {
                cartList = [];
              }
              // 新卡片
              let newCart = [
                {
                  sortKey: productInfo.sort_key,
                  productKey: productInfo.key,
                  comboKey: productCurCombo.key,
                  productNum,
                  options: productOptions,
                  selected: true,
                },
              ];
              if (orderPage) {
                window.localStorage.setItem(
                  "single_store_shopping",
                  JSON.stringify(newCart)
                );
                tracking.addToCart({ productName: productInfo.name });
                router.push(`/store/order?single_good=true`);
              } else {
                // 购物车是否存在
                if (cartList?.length > 0) {
                  let includeCurCombo = false;
                  const returnCart = cartList.map((item) => {
                    if (
                      item.sortKey === productInfo.sort_key &&
                      item.productKey === productInfo.key &&
                      item.comboKey === productCurCombo.key &&
                      (typeof item.options === "object"
                        ? JSON.stringify(item.options)
                        : item.options) === JSON.stringify(productOptions)
                    ) {
                      includeCurCombo = true;
                      return {
                        ...item,
                        productNum: Number(item.productNum) + productNum,
                      };
                    } else {
                      return item;
                    }
                  });
                  // 判断是否商品是否购物车里
                  if (includeCurCombo) {
                    newCart = returnCart;
                  } else {
                    newCart = [...newCart, ...returnCart];
                  }
                }
                tracking.addToCart({ productName: productInfo.name });
                window.localStorage.setItem(
                  "store_shopping",
                  JSON.stringify(newCart)
                );
                router.push(`/store/cart`);
              }
            }}
            className={`${styles.footer_button} ${
              !productCurCombo?.areaInfo?.price ||
              !productCurCombo?.areaInfo?.stock
                ? styles.disabled
                : ""
            }`}
          >
            {productCurCombo?.areaInfo?.price &&
            productCurCombo?.areaInfo?.stock ? (
              <>
                {orderPage
                  ? LANG["store.product.immedate_order"]
                  : LANG["store.product.add_cart"]}
              </>
            ) : (
              LANG["store.product.no_stock"]
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
