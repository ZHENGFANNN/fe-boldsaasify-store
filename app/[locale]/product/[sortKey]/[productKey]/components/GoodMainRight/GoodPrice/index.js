"use client";
import React, { Suspense } from "react";
import ProductContext from "../../../ProductContext";

import { formatCurrency } from "@/utils";
import styles from "./index.module.scss";
import PriceSkeleton from "./PriceSkeleton";

function GoodPriceContent() {
  const { LANG, productCurCombo, goodDiscountFestival, pricingLoading } =
    React.useContext(ProductContext);

  if (pricingLoading) {
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

export default function GoodPrice() {
  return (
    <Suspense fallback={<PriceSkeleton />}>
      <GoodPriceContent />
    </Suspense>
  );
}
