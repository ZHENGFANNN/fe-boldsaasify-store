/** @format */

"use client";

import React from "react";
import Script from "next/script";
import styles from "./index.module.scss";
import Link from "next/link";
import { IndexContent } from "../IndexContext";

import { formatCurrency, fillOssImage } from "@/utils";
import tracking from "@/[locale]/tracking";

const active_icon = `${process.env.NEXT_PUBLIC_FILE}/common/image/icon/previews_stars_active_icon.svg`;
const no_active_icon = `${process.env.NEXT_PUBLIC_FILE}/common/image/icon/previews_stars_icon.svg`;

// 把单个商品的 comboList[].areaList 按地区解析成 areaInfo（取首个有该地区价的套餐）。
// 与分类页 CategoryList.resolveAreaInfo 一致：服务端不再预解析，客户端按 area cookie 实时算。
function resolveAreaInfo(comboList, area) {
  const list = Array.isArray(comboList) ? comboList : [];
  for (const combo of list) {
    const areaList = Array.isArray(combo?.areaList) ? combo.areaList : [];
    const hit = areaList.find((a) => a.country_code === area);
    if (hit) return hit;
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

function ProductItem({ goodList }) {
  // 节日折扣已停用：恒为 false，下方折扣相关 UI 自然隐藏（源码保留以备复用）。
  const goodDiscountFestival = false;
  const { CONFIG, LANG, area } = React.useContext(IndexContent);
  return (
    <section className={styles.goods_container}>
      {goodList.map((product, productIndex) => {
        const areaInfo = resolveAreaInfo(product.comboList, area);
        return (
          <React.Fragment key={productIndex}>
            <Link
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
                {/* 产品价格 */}
                {!areaInfo?.selling_price ? (
                  <div className={styles.product_stock_container}>
                    {LANG["store.index.no_stock"]}
                  </div>
                ) : (
                  <div className={styles.product_price_container}>
                    {goodDiscountFestival &&
                    areaInfo?.product_discount ? (
                      <div>{`${
                        areaInfo?.currency_symbol
                      }${formatCurrency(
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
            <Script
              id={`store-index-ld-json-${productIndex}`}
              type="application/ld+json"
              dangerouslySetInnerHTML={{
                __html: JSON.stringify(
                  {
                    "@context": "https://schema.org/",
                    "@type": "Product",
                    name: product.name,
                    description: product.description,
                    image: product.image_list,
                    offers: {
                      "@type": "Offer",
                      price:
                        formatCurrency(
                          areaInfo?.selling_price,
                          areaInfo?.currency_unit
                        ) ?? 99999,
                      priceCurrency: areaInfo?.currency ?? "USD",
                    },
                    sku: CONFIG["common.base"]?.company_name,
                    mpn: product.key,
                    brand: {
                      "@type": "Brand",
                      name: `${CONFIG["common.base"]?.company_name}`,
                    },
                    review: {
                      "@type": " Organization",
                      reviewRating: {
                        "@type": "Rating",
                        ratingValue: 5,
                        bestRating: product.reviewScore || 4.8,
                      },
                      author: {
                        "@type": "Organization",
                        name: `${CONFIG["common.base"]?.company_name}`,
                      },
                    },
                  },
                  null,
                  "\t"
                ),
              }}
            />
          </React.Fragment>
        );
      })}
    </section>
  );
}

export default function ProductList() {
  const { goodSortList } = React.useContext(IndexContent);
  return (
    <div className={styles.container}>
      {goodSortList.map((item, index) => {
        return (
          <div className={styles.sort_container} key={index} id={item.key}>
            <div className={styles.sort_header}>
              <h2>{item.name}</h2>
            </div>
            <ProductItem key={index} goodList={item.goodList} />
          </div>
        );
      })}
    </div>
  );
}
