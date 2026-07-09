"use client";
import React from "react";
import ProductContext from "../../../ProductContext";

import { formatCurrency } from "@/utils";
import { discountedUnitPrice, savedUnitAmount } from "@/utils/productPricing";
import PriceSkeleton from "./PriceSkeleton";
import styles from "./index.module.scss";

export default function GoodPrice() {
  const { LANG, productCurCombo, priceLoading, discountLoading, autoDiscount } =
    React.useContext(ProductContext);

  // 价与折扣任一未就绪都用骨架占位：等两者都到再一次性渲染最终价（含折后价），
  // 避免先渲原价、折扣后到再跳成折后价的闪动。
  if (priceLoading || discountLoading) {
    return <PriceSkeleton />;
  }

  const areaInfo = productCurCombo.areaInfo;
  if (!areaInfo?.product_price) return null;

  // 命中自动折扣时：折后价（正常字号）+ 划线原价（灰色小字）+ Saved 提示行。
  // 无折扣：单价一行，保持原有 UI。
  const hasAutoDiscount = !!autoDiscount;
  const unit = areaInfo.currency_unit;
  const symbol = areaInfo.currency_symbol;
  const savedAmount = hasAutoDiscount
    ? savedUnitAmount(areaInfo, autoDiscount)
    : 0;
  const discountedPrice = hasAutoDiscount
    ? discountedUnitPrice(areaInfo, autoDiscount)
    : areaInfo.product_price;

  return (
    <>
    {hasAutoDiscount && savedAmount > 0 ? (
        <div className={styles.saved}>
          {`${LANG?.["store.product.saved"] || "Saved"} ${symbol}${formatCurrency(
            savedAmount,
            unit
          )}`}
        </div>
      ) : null}
      <div className={styles.product_price}>
        <div>{`${symbol}${formatCurrency(discountedPrice, unit)}`}</div>
        {hasAutoDiscount && savedAmount > 0 ? (
          <div>{`${symbol}${formatCurrency(areaInfo.product_price, unit)}`}</div>
        ) : null}
      </div>
    </>
  );
}
