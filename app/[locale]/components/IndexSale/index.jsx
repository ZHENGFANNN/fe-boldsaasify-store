/** @format */
"use client";

import React from "react";
import Link from "next/link";
import { IndexContent } from "../IndexContext";

import { formatCurrency, fillOssImage } from "@/utils";
import tracking from "@/[locale]/tracking";
import useArea from "@/hooks/useArea";
import Skeleton from "@/components/Skeleton";
import getProductsPricing from "@/service/product/get-products-pricing";

import listStyles from "../IndexProductList/index.module.scss";
import styles from "./index.module.scss";

// 复刻 IndexProductList 的 areaInfo 选取（取首个有 areaInfo 的 combo）
function pickAreaInfo(pricingItem) {
  if (!pricingItem) return null;
  const combos = Array.isArray(pricingItem.combos) ? pricingItem.combos : [];
  for (const c of combos) {
    if (c?.areaInfo) return c.areaInfo;
  }
  return null;
}

/**
 * IndexSale 折扣商品横向列表。
 *
 * 数据驱动：直接读 IndexContent.goodsSortList 平铺商品 → 调 getProductsPricing 批量取价 →
 * 过滤 selling_price < product_price 的商品。
 *
 * 用法：
 *   - 首页：`<IndexSale limit={8} />` 顶 Top 8 件
 *   - Sale 落地页：`<IndexSale limit={Infinity} title="..." />`
 */
export default function IndexSale({ limit = 8, title, viewAllHref = "/sale" }) {
  const { LANG, goodsSortList, locale } = React.useContext(IndexContent);
  const { area, areaReady } = useArea();

  // 平铺所有 sort 下的商品
  const flatProducts = React.useMemo(() => {
    const out = [];
    goodsSortList.forEach((sort) => {
      (sort.goodList || []).forEach((p) => {
        if (p.sort_key && p.key) {
          out.push(p);
        }
      });
    });
    return out;
  }, [goodsSortList]);

  const allKeys = React.useMemo(
    () => flatProducts.map((p) => ({ sortKey: p.sort_key, productKey: p.key })),
    [flatProducts]
  );

  const [pricingMap, setPricingMap] = React.useState(null);

  React.useEffect(() => {
    if (!areaReady) return;
    let cancelled = false;
    const effectiveArea = area || "us";
    getProductsPricing({
      area: effectiveArea,
      locale,
      keys: allKeys
    }).then((data) => {
      if (cancelled) return;
      const map = {};
      (data?.list || []).forEach((item) => {
        map[`${item.sortKey}:${item.productKey}`] = item;
      });
      setPricingMap(map);
    });
    return () => {
      cancelled = true;
    };
  }, [areaReady, area, locale, allKeys]);

  const pricingReady = pricingMap !== null;

  // 过滤折扣商品 + 截断到 limit 件
  const saleProducts = React.useMemo(() => {
    if (!pricingReady) return [];
    const out = [];
    for (const product of flatProducts) {
      const areaInfo = pickAreaInfo(
        pricingMap[`${product.sort_key}:${product.key}`]
      );
      if (!areaInfo?.product_price || !areaInfo?.selling_price) continue;
      if (Number(areaInfo.selling_price) >= Number(areaInfo.product_price))
        continue;
      out.push({ product, areaInfo });
      if (out.length >= limit) break;
    }
    return out;
  }, [flatProducts, pricingMap, pricingReady, limit]);

  // 数据未就绪 → 占位骨架（避免布局抖动）；就绪后无折扣商品 → 隐藏整个模块。
  if (pricingReady && saleProducts.length === 0) return null;

  return (
    <div className={listStyles.container}>
      <div className={listStyles.sort_container}>
        <div className={listStyles.sort_header}>
          <h2>{title || LANG?.["store.index.sale"] || "On Sale"}</h2>
          {limit !== Infinity && pricingReady ? (
            <Link href={viewAllHref} className={styles.view_all}>
              {LANG?.["store.index.view_all"] || "View All →"}
            </Link>
          ) : null}
        </div>
        <section className={listStyles.goods_container}>
          {!pricingReady
            ? Array.from({
                length: Math.min(limit === Infinity ? 6 : limit, 6)
              }).map((_, i) => (
                <div key={i} className={listStyles.goods_item}>
                  <div className={listStyles.image_container}>
                    <Skeleton variant="rect" width="100%" height={280} />
                  </div>
                  <div className={listStyles.content_container}>
                    <Skeleton variant="text" width="80%" height={20} />
                    <Skeleton variant="text" width="60%" height={16} />
                  </div>
                </div>
              ))
            : saleProducts.map(({ product, areaInfo }, productIndex) => {
                const discountPercent = Math.round(
                  (1 -
                    Number(areaInfo.selling_price) /
                      Number(areaInfo.product_price)) *
                    100
                );
                return (
                  <Link
                    key={productIndex}
                    scroll={true}
                    onClick={() =>
                      tracking.clickIndexProduct({ productName: product.key })
                    }
                    href={`/product/${product.sort_key}/${product.key}`}
                    className={listStyles.goods_item}
                  >
                    <div
                      className={listStyles.image_container}
                      data-scenes={!!product.image_scenes}
                    >
                      <img
                        data-loading
                        className={listStyles.product_image}
                        alt={product.name}
                        src={fillOssImage(product.image)}
                      />
                      {product.image_scenes ? (
                        <img
                          data-loading
                          className={listStyles.scenes_image}
                          alt={product.name}
                          src={fillOssImage(product.image_scenes)}
                        />
                      ) : null}
                    </div>
                    <div className={listStyles.content_container}>
                      <h3 className={listStyles.product_name}>
                        {product.name}
                      </h3>
                      {discountPercent > 0 ? (
                        <div className={listStyles.good_discount_container}>
                          <div className={listStyles.off}>
                            {LANG?.["store.index.off"] || "OFF"}
                          </div>
                          <div className={listStyles.discount}>
                            {discountPercent}%
                          </div>
                        </div>
                      ) : null}
                      <div className={listStyles.product_price_container}>
                        <div>{`${areaInfo.currency_symbol}${formatCurrency(
                          areaInfo.selling_price,
                          areaInfo.currency_unit
                        )}`}</div>
                        <div>{`${areaInfo.currency_symbol}${formatCurrency(
                          areaInfo.product_price,
                          areaInfo.currency_unit
                        )}`}</div>
                      </div>
                    </div>
                  </Link>
                );
              })}
        </section>
      </div>
    </div>
  );
}
