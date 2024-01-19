"use client";

import React from "react";
import styles from "./index.module.scss";
import useProductStore from "../../productStore";
import ProductContext from "../../productContext";
import tracking from "../../tracking";
import { useRouter, useSearchParams } from "next/navigation";

import $ from "jquery";

export default function GoodFooter({
  locale,
  areaCode,
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
            {goodDiscountFestival && productCurCombo.areaInfo?.good_discount ? (
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
          {productCurCombo?.areaInfo?.price &&
          productCurCombo?.areaInfo?.stock ? (
            <>
              <div
                onClick={() => {
                  const $btnDom = $("[data-role='buy-btn-list']");
                  const domHeight = $btnDom.height();
                  const domTop = $btnDom.offset().top;
                  const screenHeight = $(window).height();

                  console.log(domHeight, domTop, screenHeight);
                  window.scrollTo({
                    left: 0,
                    top: domTop - screenHeight + domHeight,
                    behavior: "smooth",
                  });
                }}
                className={`${styles.footer_button} ${
                  !productCurCombo?.areaInfo?.price ||
                  !productCurCombo?.areaInfo?.stock
                    ? styles.disabled
                    : ""
                }`}
              >
                {LANG["store.product.buy"]}
              </div>
            </>
          ) : (
            <div
              className={`${styles.footer_button} ${
                !productCurCombo?.areaInfo?.price ||
                !productCurCombo?.areaInfo?.stock
                  ? styles.disabled
                  : ""
              }`}
            >
              {LANG["store.product.no_stock"]}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
