"use client";
import React from "react";
import ProductContext from "../../ProductContext";

import formatCurrency from "@/utils/formatCurrency";
import styles from "./index.module.scss";

export default function GoodPrice() {
  const { LANG, productCurCombo, goodDiscountFestival } =
    React.useContext(ProductContext);

  return (
    <>
      {/* 优惠金额 */}
      {goodDiscountFestival && productCurCombo.areaInfo?.product_discount ? (
        <div className={styles.discount_price}>
          {`${LANG["store.product.saved"]} ${
            productCurCombo.areaInfo.currency_symbol
          }${formatCurrency(
            productCurCombo.areaInfo?.product_price -
              productCurCombo.areaInfo?.selling_price
          )}`}
        </div>
      ) : null}
      {/* 价格计算 */}
      {productCurCombo.areaInfo?.product_price ? (
        <div className={styles.product_price}>
          {goodDiscountFestival &&
          productCurCombo.areaInfo?.product_discount ? (
            <div>{`${productCurCombo.areaInfo.currency_symbol}${formatCurrency(
              productCurCombo.areaInfo?.selling_price
            )}`}</div>
          ) : null}
          <div>
            {`${productCurCombo.areaInfo.currency_symbol}${formatCurrency(
              productCurCombo.areaInfo.product_price
            )}`}
          </div>
        </div>
      ) : null}
    </>
  );
}
