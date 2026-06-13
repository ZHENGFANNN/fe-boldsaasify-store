"use client";
import React from "react";
import ProductContext from "../../../ProductContext";

import { formatCurrency } from "@/utils";
import PriceSkeleton from "./PriceSkeleton";
import styles from "./index.module.scss";

export default function GoodPrice() {
  const { LANG, productCurCombo, goodDiscountFestival, priceLoading } =
    React.useContext(ProductContext);

  // 非 us 地区拉取地区价期间：种子价(us)不可信，用骨架占位。
  if (priceLoading) {
    return <PriceSkeleton />;
  }

  return (
    <>
      {goodDiscountFestival && productCurCombo.areaInfo?.product_discount ? (
        <div className={styles.discount_price}>
          {`${LANG["store.product.saved"]} ${
            productCurCombo.areaInfo.currency_symbol
          }${formatCurrency(
            productCurCombo.areaInfo?.product_price -
              productCurCombo.areaInfo?.selling_price,
            productCurCombo.areaInfo?.currency_unit
          )}`}
        </div>
      ) : null}
      {productCurCombo.areaInfo?.product_price ? (
        <div className={styles.product_price}>
          {goodDiscountFestival &&
          productCurCombo.areaInfo?.product_discount ? (
            <div>{`${productCurCombo.areaInfo.currency_symbol}${formatCurrency(
              productCurCombo.areaInfo?.selling_price,
              productCurCombo.areaInfo?.currency_unit
            )}`}</div>
          ) : null}
          <div>
            {`${productCurCombo.areaInfo.currency_symbol}${formatCurrency(
              productCurCombo.areaInfo.product_price,
              productCurCombo.areaInfo?.currency_unit
            )}`}
          </div>
        </div>
      ) : null}
    </>
  );
}
