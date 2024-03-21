"use client";

import React from "react";
import styles from "./index.module.scss";
import useProductStore from "../../productStore";
import ProductContext from "../../productContext";
import tracking from "../../tracking";
import ComboModal from "./components/ComboModal";
import formatCurrency from "@/utils/formatCurrency";

export default function GoodFooter({
  CONFIG,
  LANG,
  area,
  locale,
  productInfo,
  goodDiscountFestival,
  options,
}) {
  const comboModalRef = React.useRef(null);

  const { lazyLoading } = React.useContext(ProductContext);
  const productNum = useProductStore((state) => state.productNum);
  const productCurCombo = useProductStore((state) => state.productCurCombo);
  // Footer处理
  React.useEffect(() => {
    if (!lazyLoading) {
      // 埋点 - 查看次数
      tracking.viewContent({
        productName: productInfo.key,
      });

      const $footerDom = $('[data-role="footer-buy"]');
      // 计算底部位置
      const height = $footerDom.outerHeight();
      $("[data-role='footer-info']").css({
        paddingBottom: height,
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
          <h3>{productInfo.name}</h3>
          <div className={styles.combo}>
            {productCurCombo?.title ? (
              <>
                <div
                  onClick={() => {
                    tracking.clickProductFooterBtn({
                      productName: productInfo.key,
                      type: "combo",
                    });
                    comboModalRef.current.show();
                  }}
                  className={styles.combo_name}
                >
                  <img
                    alt="combo"
                    src={`${process.env.NEXT_PUBLIC_IMAGE}/icon/product-combo.svg`}
                  />
                  <span>{productCurCombo.title}</span>
                </div>
                {productNum > 1 ? (
                  <span className={styles.num}>{` × ${productNum}`}</span>
                ) : null}
              </>
            ) : null}
          </div>
        </div>
        <div className={styles.footer_right}>
          <div className={styles.footer_price}>
            {productCurCombo.areaInfo?.product_price ? (
              <div className={styles.price}>
                {goodDiscountFestival &&
                productCurCombo.areaInfo.product_discount ? (
                  <div>{`${
                    productCurCombo.areaInfo.currency_symbol
                  }${formatCurrency(
                    productCurCombo.areaInfo.selling_price * productNum
                  )}`}</div>
                ) : null}
                <div>{`${
                  productCurCombo.areaInfo.currency_symbol
                }${formatCurrency(
                  productCurCombo.areaInfo.product_price * productNum
                )}`}</div>
              </div>
            ) : null}
            {goodDiscountFestival &&
            productCurCombo.areaInfo?.product_discount ? (
              <div className={styles.save_price}>
                -{" "}
                {`${productCurCombo.areaInfo.currency_symbol}${formatCurrency(
                  (productCurCombo.areaInfo.product_price -
                    productCurCombo.areaInfo.selling_price) *
                    productNum
                )}`}
              </div>
            ) : null}
          </div>
          {productCurCombo?.areaInfo?.product_price &&
          productCurCombo?.areaInfo?.stock ? (
            <>
              <div
                onClick={() => {
                  comboModalRef.current.show();
                  tracking.clickProductFooterBtn({
                    productName: productInfo.key,
                    type: "buy",
                  });
                }}
                className={`${styles.footer_button}`}
              >
                {LANG["store.product.buy"]}
              </div>
            </>
          ) : (
            <div className={`${styles.footer_button} ${styles.disabled}`}>
              {LANG["store.product.no_stock"]}
            </div>
          )}
        </div>
      </div>
      <ComboModal
        area={area}
        locale={locale}
        productInfo={productInfo}
        options={options}
        GOODDISCOUNTFESTIVAL={goodDiscountFestival}
        LANG={LANG}
        CONFIG={CONFIG}
        ref={comboModalRef}
      />
    </section>
  );
}
