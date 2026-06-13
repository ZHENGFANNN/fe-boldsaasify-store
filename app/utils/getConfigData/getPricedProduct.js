/** @format */

import { getProductPage } from "@/config/Api/getProductPage";
import { getProductPricing } from "@/config/Api/getProductPricing";
import { applyProductPricing } from "../productPricing";

/**
 * 合并商品详情与地区定价（getProductPage + getProductPricing，均已 use cache）。
 */
export async function getPricedProduct({
  locale,
  sortKey,
  productKey,
  area = "us",
}) {
  const { productInfo } = await getProductPage({ locale, sortKey, productKey });
  if (!productInfo?.key) return null;

  const pricing = await getProductPricing({
    sortKey,
    productKey,
    area,
    locale,
  });

  return applyProductPricing(productInfo, pricing);
}

export default getPricedProduct;
