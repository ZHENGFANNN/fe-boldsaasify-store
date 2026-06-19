"use client";
import React from "react";
import ProductContext from "../../../ProductContext";

import { formatCurrency } from "@/utils";
import PriceSkeleton from "./PriceSkeleton";
import styles from "./index.module.scss";

export default function GoodPrice() {
  const { LANG, productCurCombo, priceLoading } =
    React.useContext(ProductContext);

  // 非 us 地区拉取地区价期间：种子价(us)不可信，用骨架占位。
  if (priceLoading) {
    return <PriceSkeleton />;
  }

  const areaInfo = productCurCombo.areaInfo;
  // 数据驱动判定：只要 selling_price < product_price 就显示折扣 UI（划线原价 + 折后价 + 节省金额）。
  // 不再依赖节日开关 —— 折扣由 ERP 商品价格配置直接驱动。
  const hasDiscount =
    !!areaInfo?.selling_price &&
    !!areaInfo?.product_price &&
    Number(areaInfo.selling_price) < Number(areaInfo.product_price);

  return (
    <>
      {hasDiscount ? (
        <div className={styles.discount_price}>
          {`${LANG["store.product.saved"] || "Saved"} ${
            areaInfo.currency_symbol
          }${formatCurrency(
            areaInfo.product_price - areaInfo.selling_price,
            areaInfo.currency_unit
          )}`}
        </div>
      ) : null}
      {areaInfo?.product_price ? (
        <div className={styles.product_price}>
          {hasDiscount ? (
            <div>{`${areaInfo.currency_symbol}${formatCurrency(
              areaInfo.selling_price,
              areaInfo.currency_unit
            )}`}</div>
          ) : null}
          <div>
            {`${areaInfo.currency_symbol}${formatCurrency(
              areaInfo.product_price,
              areaInfo.currency_unit
            )}`}
          </div>
        </div>
      ) : null}
    </>
  );
}
