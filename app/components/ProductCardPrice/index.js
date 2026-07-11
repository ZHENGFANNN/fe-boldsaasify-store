/** @format */

"use client";

import React from "react";
import styles from "./index.module.scss";
import { formatCurrency } from "@/utils";
import { discountedUnitPrice, formatDiscountLabel } from "@/utils/productPricing";

/**
 * 商品卡片价格块（全站统一）：命中自动折扣 → 折后价 + 划线原价（可选折扣标签）；
 * 否则只展示原价。抽自详情页 AssociateProductList 的价格渲染，供
 * 详情页关联产品 / 首页商品列表 / 博客关联产品复用，保证折后价口径一致。
 *
 * 视觉：根节点合并调用方传入的定位类名（各卡片自带 absolute 定位与字号），
 * 组件自身 scss 只提供基础排版与「第二个 div = 划线原价」的样式兜底，
 * 与各调用方 scss 的 `.product_price_container div:nth-child(2)` 效果一致。
 *
 * @param areaInfo   含 product_price / currency_symbol / currency_unit 的地区定价对象。
 * @param discount   命中的自动折扣（已由 pickAutoDiscount 过滤过期）；falsy 表示无折扣。
 * @param LANG       文案表（仅折扣标签用）。
 * @param className  调用方定位类名（如各页的 styles.product_price_container）。
 * @param showLabel  是否展示折扣标签（默认 false，现有卡片均不在价格块内展示标签）。
 */
export default function ProductCardPrice({
  areaInfo,
  discount,
  LANG,
  className = "",
  showLabel = false,
}) {
  const symbol = areaInfo?.currency_symbol;
  const unit = areaInfo?.currency_unit;
  const original = areaInfo?.product_price;
  const current = discount ? discountedUnitPrice(areaInfo, discount) : original;

  return (
    <div className={`${styles.product_price_container} ${className}`.trim()}>
      <div className={styles.current_price}>
        {`${symbol}${formatCurrency(current, unit)}`}
      </div>
      {discount ? (
        <div className={styles.origin_price}>
          {`${symbol}${formatCurrency(original, unit)}`}
        </div>
      ) : null}
      {showLabel && discount ? (
        <span className={styles.discount_label}>
          {formatDiscountLabel(discount, areaInfo, LANG)}
        </span>
      ) : null}
    </div>
  );
}
