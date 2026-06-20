"use client";

import React from "react";
import styles from "./index.module.scss";
import ProductContext from "../../ProductContext";
import tracking from "../../tracking";
import ComboModal from "./components/ComboModal";
import { formatCurrency } from "@/utils";
import { debounce } from "@/utils";
import { effectivePrice } from "@/utils/productPricing";
import { recordRecentlyViewed } from "@/components/LiveChat/recentlyViewed";

export default function GoodFooter() {
  // 节日折扣已停用：恒为 false，下方折扣相关 UI 自然隐藏（源码保留以备复用）。
  const goodDiscountFestival = false;
  const {
    LANG,
    // goodDiscountFestival,
    productInfo,
    productNum,
    productCurCombo,
    optionAxes,
    optionSelection,
    lazyLoading,
  } = React.useContext(ProductContext);
  const comboModalRef = React.useRef(null);

  // 已选变体摘要（V2）：由选中的轴值派生 "轴名: 值名" 串，展示在底部购买栏。
  const optionString = React.useMemo(() => {
    const parts = (optionAxes || [])
      .map((axis) => {
        const code = optionSelection?.[axis.axis_code];
        const val = axis.values.find((v) => v.value_code === code);
        if (!val?.value_label) return null;
        return `${axis.axis_name}: ${val.value_label}`;
      })
      .filter(Boolean);
    return parts.length > 0 ? parts.join("  ") : null;
  }, [optionAxes, optionSelection]);

  // 弹出时机
  React.useEffect(() => {
    if (!lazyLoading) {
      // 埋点 - 查看次数
      tracking.viewContent({
        productName: productInfo.key,
      });
      // 记录最近浏览，供客服聊天窗「分享商品」选择器读取（纯客户端）
      const pathname = window.location.pathname;
      recordRecentlyViewed({
        productKey: productInfo.key,
        sortKey: pathname.split("/")[3] || "",
        title: productInfo.name,
        image: productInfo.image_list?.[0]?.src || "",
        symbol: productCurCombo?.areaInfo?.currency_symbol || "",
        price: productCurCombo?.areaInfo?.product_price ?? "",
        href: pathname,
      });
      const $footerDom = $('[data-role="footer-buy"]');
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
      return () => $(window).off("scroll", scrollFunc);
    }
  }, [lazyLoading]);

  // 处理底部按钮
  React.useEffect(() => {
    if (!lazyLoading) {
      const $footerDom = $('[data-role="footer-buy"]');
      function onResizeChange() {
        // 计算底部位置
        const height = $footerDom.outerHeight();
        $("[data-role='footer-info']").css({
          paddingBottom: height,
        });
      }
      onResizeChange();
      window.addEventListener("resize", onResizeChange);
      return () => {
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
                    tracking.clickProductFooterCombo({
                      productName: productInfo.key,
                    });
                    comboModalRef.current.show();
                  }}
                  className={styles.combo_name}
                >
                  <img
                    alt="combo"
                    src={`${process.env.NEXT_PUBLIC_FILE}/common/image/icon/product-combo.svg`}
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
                  effectivePrice(productCurCombo.areaInfo) * productNum,
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
                  tracking.clickProductFooterBuyBtn({
                    productName: productInfo.key,
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
