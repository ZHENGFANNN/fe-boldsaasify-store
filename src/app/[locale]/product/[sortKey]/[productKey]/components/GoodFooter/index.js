"use client";

import React from "react";
import styles from "./index.module.scss";
import ProductContext from "../../ProductContext";
import tracking from "../../tracking";
import ComboModal from "./components/ComboModal";
import { formatCurrency } from "@/utils";

import { debounce } from "@/utils";

export default function GoodFooter() {
  const {
    LANG,
    goodDiscountFestival,
    productInfo,
    productNum,
    productCurCombo,
    productOptions,
    lazyLoading,
  } = React.useContext(ProductContext);
  const comboModalRef = React.useRef(null);

  // 处理选项Options
  const optionString = React.useMemo(() => {
    let optString = "";
    if (Object.keys(productOptions).length > 0) {
      Object.keys(productOptions).forEach((key) => {
        optString =
          optString +
          `  ${productOptions[key].name}: ${productOptions[key].value}`;
      });
      return optString.trimStart();
    } else {
      return null;
    }
  }, [productOptions]);

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
      const scrollFunc = debounce(function () {
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
      }, 50);
      scrollFunc();
      $(window).on("scroll", scrollFunc);
      return () => {
        $(window).off("scroll", scrollFunc);
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
          <div className={styles.combo_option_container}>
            {productCurCombo?.title || optionString ? (
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
                    src={`${process.env.NEXT_PUBLIC_FILE}/image/icon/product-combo.svg`}
                  />
                  <div className={styles.name_container}>
                    <h3>{productInfo.name}</h3>
                    <div>{productCurCombo.title}</div>
                    {optionString ? (
                      <div className={styles.option_name}>{optionString}</div>
                    ) : null}
                  </div>
                  <div className={styles.arrow_icon}></div>
                </div>
                {productNum > 1 ? (
                  <span className={styles.num}>{` ×${productNum}`}</span>
                ) : null}
              </>
            ) : null}
          </div>
        </div>
        <div className={styles.footer_right}>
          <div className={styles.footer_price}>
            {productCurCombo.areaInfo?.product_price ? (
              <div className={styles.price}>
                <div>{`${
                  productCurCombo.areaInfo.currency_symbol
                }${formatCurrency(
                  productCurCombo.areaInfo.selling_price * productNum,
                  productCurCombo.areaInfo?.currency_unit
                )}`}</div>
              </div>
            ) : null}
            {goodDiscountFestival &&
            productCurCombo.areaInfo?.product_discount ? (
              <div className={styles.save_price}>
                {`${LANG["store.product.saved"]} ${
                  productCurCombo.areaInfo.currency_symbol
                }${formatCurrency(
                  (productCurCombo.areaInfo.product_price -
                    productCurCombo.areaInfo.selling_price) *
                    productNum,
                  productCurCombo.areaInfo?.currency_unit
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
      <ComboModal ref={comboModalRef} />
    </section>
  );
}
