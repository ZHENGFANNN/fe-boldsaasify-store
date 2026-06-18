/** @format */

"use client";

import React from "react";
import styles from "./index.module.scss";
import Link from "next/link";
import { IndexContent } from "../IndexContext";

import { formatCurrency, fillOssImage } from "@/utils";
import tracking from "@/[locale]/tracking";
import useArea from "@/hooks/useArea";
import Skeleton from "@/components/Skeleton";
import getProductsPricing from "@/service/product/get-products-pricing";

const active_icon = `${process.env.NEXT_PUBLIC_FILE}/common/image/icon/previews_stars_active_icon.svg`;
const no_active_icon = `${process.env.NEXT_PUBLIC_FILE}/common/image/icon/previews_stars_icon.svg`;

// 从批量取价结果挑出当前商品的 areaInfo：取首个有 areaInfo 的 combo（与原 resolveAreaInfo 行为对齐）。
function pickAreaInfo(pricingItem) {
  if (!pricingItem) return null;
  const combos = Array.isArray(pricingItem.combos) ? pricingItem.combos : [];
  for (const c of combos) {
    if (c?.areaInfo) return c.areaInfo;
  }
  return null;
}

function ReviewRate({ LANG, reviewScore, reviewsNum }) {
  return (
    <div className={styles.stars_container}>
      <div className={styles.no_active_stars}>
        <img alt="no_active_icon" src={no_active_icon} />
        <img alt="no_active_icon" src={no_active_icon} />
        <img alt="no_active_icon" src={no_active_icon} />
        <img alt="no_active_icon" src={no_active_icon} />
        <img alt="no_active_icon" src={no_active_icon} />
      </div>
      <div
        className={styles.active_stars}
        style={{
          width: 90 * (reviewScore / 5),
        }}
      >
        <img alt="active_icon" src={active_icon} />
        <img alt="active_icon" src={active_icon} />
        <img alt="active_icon" src={active_icon} />
        <img alt="active_icon" src={active_icon} />
        <img alt="active_icon" src={active_icon} />
      </div>
      <div className={styles.score}>{`( ${LANG["store.index.reviews"]?.replace(
        "${num}",
        reviewsNum
      )} )`}</div>
    </div>
  );
}

function ProductItem({ goodList, LANG, pricingMap, pricingReady }) {
  // 节日折扣已停用：恒为 false，下方折扣相关 UI 自然隐藏（源码保留以备复用）。
  const goodDiscountFestival = false;
  return (
    <section className={styles.goods_container}>
      {goodList.map((product, productIndex) => {
        const areaInfo = pricingReady
          ? pickAreaInfo(pricingMap?.[`${product.sort_key}:${product.key}`])
          : null;
        return (
          <Link
            key={productIndex}
            scroll={true}
            onClick={() => {
              tracking.clickIndexProduct({
                productName: product.key,
              });
            }}
            href={`/product/${product.sort_key}/${product.key}`}
            className={styles.goods_item}
          >
            <div
              className={styles.image_container}
              data-scenes={!!product.image_scenes}
            >
              <img
                data-loading
                className={styles.product_image}
                alt={product.name}
                src={fillOssImage(product.image)}
              />
              {product.image_scenes ? (
                <img
                  data-loading
                  className={styles.scenes_image}
                  alt={product.name}
                  src={fillOssImage(product.image_scenes)}
                />
              ) : null}
            </div>
            <div className={styles.content_container}>
              {/* 产品评分 */}
              {product.reviews_score ? (
                <ReviewRate
                  LANG={LANG}
                  reviewsNum={product.reviews_num}
                  reviewScore={product.reviews_score}
                />
              ) : null}
              {/* 产品名称 */}
              <h3 className={styles.product_name}>{product.name}</h3>
              {/* 产品优惠 */}
              {goodDiscountFestival && areaInfo?.product_discount ? (
                <div className={styles.good_discount_container}>
                  <div className={styles.off}>{LANG["store.index.off"]}</div>
                  <div className={styles.discount}>
                    {100 - areaInfo?.product_discount}%
                  </div>
                </div>
              ) : null}
              {/* 产品价格：pricing 未就绪显示骨架；就绪后无 selling_price 显示缺货；否则真实价格 */}
              {!pricingReady ? (
                <div className={styles.product_price_container}>
                  <Skeleton variant="rect" width={80} height={16} />
                </div>
              ) : !areaInfo?.selling_price ? (
                <div className={styles.product_stock_container}>
                  {LANG["store.index.no_stock"]}
                </div>
              ) : (
                <div className={styles.product_price_container}>
                  {goodDiscountFestival && areaInfo?.product_discount ? (
                    <div>{`${areaInfo?.currency_symbol}${formatCurrency(
                      areaInfo?.selling_price,
                      areaInfo?.currency_unit
                    )}`}</div>
                  ) : null}
                  <div>{`${areaInfo?.currency_symbol}${formatCurrency(
                    areaInfo?.product_price,
                    areaInfo?.currency_unit
                  )}`}</div>
                </div>
              )}
            </div>
          </Link>
        );
      })}
    </section>
  );
}

export default function ProductList() {
  const { LANG, goodSortList, locale } = React.useContext(IndexContent);
  const { area, areaReady } = useArea();

  // 全部 (sortKey, productKey) 集合（一次批量取价的输入）。
  const allKeys = React.useMemo(() => {
    const keys = [];
    goodSortList.forEach((sort) => {
      (sort.goodList || []).forEach((p) => {
        if (p.sort_key && p.key) {
          keys.push({ sortKey: p.sort_key, productKey: p.key });
        }
      });
    });
    return keys;
  }, [goodSortList]);

  // pricingMap: { "{sortKey}:{productKey}": ProductsPricingItem } —— null 表示未就绪。
  const [pricingMap, setPricingMap] = React.useState(null);

  React.useEffect(() => {
    if (!areaReady) return;
    let cancelled = false;
    const effectiveArea = area || "us";
    getProductsPricing({
      area: effectiveArea,
      locale,
      keys: allKeys,
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

  return (
    <div className={styles.container}>
      {goodSortList.map((item, index) => {
        return (
          <div className={styles.sort_container} key={index} id={item.key}>
            <div className={styles.sort_header}>
              <h2>{item.name}</h2>
            </div>
            <ProductItem
              key={index}
              goodList={item.goodList}
              LANG={LANG}
              pricingMap={pricingMap}
              pricingReady={pricingReady}
            />
          </div>
        );
      })}
    </div>
  );
}
