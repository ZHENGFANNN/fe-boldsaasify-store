/** @format */

"use client";

import React from "react";
import getProductsOffer from "@/service/product/get-offer";

/**
 * 客户端按 area 批量取商品「自动折扣」命中表（限时促销）。
 * 抽离 BaseLayout / IndexProductList / blog ProductModal 三处重复的
 * 「组 keys → getProductsOffer → 按 product_key 建 discountMap」逻辑。
 *
 * 只关心折扣（价格由各页各自处理），故只返回 discountMap；
 * 需要地区价（combos）的场景请直接用 getProductsOffer 取完整聚合数据。
 *
 * @param productList 商品列表；每项取 sort_key/sortKey 与 key/productKey 组 offer keys。
 * @param options.area   地区码（缺省不发请求）。
 * @param options.locale 语言（透传给接口，折扣与语言无关，仅价格文案用）。
 * @returns { discountMap: { [product_key]: discount }, loading: boolean }
 *          discountMap 为整表下发，过期过滤交由消费方 pickAutoDiscount 逐项处理。
 */
export function useProductsOffer(productList, { area, locale } = {}) {
  const [discountMap, setDiscountMap] = React.useState({});
  const [loading, setLoading] = React.useState(true);

  // 组 offer keys：兼容 { sort_key, key }（服务端商品结构）与 { sortKey, productKey }。
  const keys = React.useMemo(
    () =>
      (productList || [])
        .map((p) => ({
          sortKey: p?.sort_key || p?.sortKey,
          productKey: p?.key || p?.productKey,
        }))
        .filter((k) => k.sortKey && k.productKey),
    [productList]
  );

  React.useEffect(() => {
    // area 未就绪或无有效 keys → 不发请求，直接空表就绪。
    if (!area || keys.length === 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDiscountMap({});
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    getProductsOffer({ area, locale, keys }).then((data) => {
      if (cancelled) return;
      const dMap = {};
      (data?.list || []).forEach((item) => {
        if (item.discount) dMap[item.productKey] = item.discount;
      });
      setDiscountMap(dMap);
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [area, locale, keys]);

  return { discountMap, loading };
}

export default useProductsOffer;
