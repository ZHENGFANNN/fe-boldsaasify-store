"use client";

import React from "react";
import Cookies from "js-cookie";
import ProductContext from "../../ProductContext";
import {
  applyProductPricing,
  fetchProductPricing,
  pickCombo,
} from "@/utils/productPricing";

/**
 * 客户端按 area cookie 拉取地区价格，合并进 ProductContext。
 * 价格未就绪时 pricingLoading=true，GoodPrice 显示方块 skeleton。
 */
export default function ProductPricingLoader({
  sortKey,
  productKey,
  locale,
  baseProductInfo,
}) {
  const ctx = React.useContext(ProductContext);
  if (!ctx) return null;

  const {
    area,
    setPricingState,
    productCurCombo,
    setProductCurCombo,
  } = ctx;

  const comboKeyRef = React.useRef(productCurCombo?.key);

  React.useEffect(() => {
    comboKeyRef.current = productCurCombo?.key;
  }, [productCurCombo?.key]);

  React.useEffect(() => {
    if (!baseProductInfo?.key) return;

    let cancelled = false;
    setPricingState({ pricingLoading: true, goodDiscountFestival: false });

    (async () => {
      try {
        const pricing = await fetchProductPricing({
          sortKey,
          productKey,
          area: area || Cookies.get("area") || "us",
          language: locale,
        });
        if (cancelled) return;

        const merged = applyProductPricing(baseProductInfo, pricing);
        const nextCombo = pickCombo(merged.comboList, comboKeyRef.current);

        setPricingState({
          pricingLoading: false,
          goodDiscountFestival: !!pricing?.festivalDiscount,
          productInfo: merged,
          productCurCombo: nextCombo,
        });
      } catch (err) {
        if (cancelled) return;
        console.error("ProductPricingLoader:", err?.message);
        setPricingState({ pricingLoading: false });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    area,
    baseProductInfo,
    locale,
    productKey,
    setPricingState,
    sortKey,
  ]);

  return null;
}
