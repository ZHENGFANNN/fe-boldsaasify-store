"use client";
import React from "react";
import ProductContext from "../../../ProductContext";

import { formatCurrency } from "@/utils";
import PriceSkeleton from "./PriceSkeleton";
import styles from "./index.module.scss";

export default function GoodPrice() {
  const { productCurCombo, priceLoading } = React.useContext(ProductContext);

  // 非 us 地区拉取地区价期间：种子价(us)不可信，用骨架占位。
  if (priceLoading) {
    return <PriceSkeleton />;
  }

  const areaInfo = productCurCombo.areaInfo;
  // 价格区只展示单一原价（product_price）。商品级折后价(selling_price)/划线双价已下线，
  // 所有优惠统一由折扣系统（折扣码/自动规则）在结算链路上处理。
  return (
    <>
      {areaInfo?.product_price ? (
        <div className={styles.product_price}>
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
