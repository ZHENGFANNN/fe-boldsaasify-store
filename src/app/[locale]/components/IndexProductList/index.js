"use client";

import React from "react";
import Script from "next/script";
import styles from "./index.module.scss";
import Link from "next/link";
import { IndexContent } from "../IndexContext";
const active_icon = `${process.env.NEXT_PUBLIC_IMAGE}/icon/previews_stars_active_icon.svg`;
const no_active_icon = `${process.env.NEXT_PUBLIC_IMAGE}/icon/previews_stars_icon.svg`;

import formatCurrency from "@/utils/formatCurrency";
import tracking from "../../tracking";

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
      <div className={styles.score}>{`( ${LANG[
        "store.product.reviews"
      ]?.replace("${num}", reviewsNum)} )`}</div>
    </div>
  );
}

function ProductItem({ goodList }) {
  const { CONFIG, LANG, goodDiscountFestival } = React.useContext(IndexContent);
  return (
    <section className={styles.goods_container}>
      {goodList.map((product, productIndex) => {
        return (
          <React.Fragment key={productIndex}>
            <Link
              onClick={() => {
                tracking.enterProduct({
                  productName: product.key,
                });
              }}
              href={`/store/product/${product.sort_key}/${product.key}`}
              className={styles.goods_item}
            >
              <div
                className={styles.image_container}
                data-scenes={!!product.image_scenes}
              >
                <img
                  className={styles.product_image}
                  alt={product.name}
                  src={product.image_list[0].src}
                />
                {product.image_scenes ? (
                  <img
                    className={styles.scenes_image}
                    alt={product.name}
                    src={product.image_scenes}
                  />
                ) : null}
              </div>
              <div className={styles.content_container}>
                {/* 产品评分 */}
                {!isNaN(product.reviewScore) ? (
                  <ReviewRate
                    LANG={LANG}
                    reviewsNum={
                      product.reviewsList.length || product.reviews_num
                    }
                    reviewScore={product.reviewScore}
                  />
                ) : null}
                {/* 产品名称 */}
                <h3 className={styles.product_name}>{product.name}</h3>
                {/* 产品优惠 */}
                {goodDiscountFestival && product.areaInfo?.product_discount ? (
                  <div className={styles.good_discount_container}>
                    <div className={styles.off}>{LANG["store.index.off"]}</div>
                    <div className={styles.discount}>
                      {100 - product.areaInfo?.product_discount}%
                    </div>
                  </div>
                ) : null}
                {/* 产品价格 */}
                {!product.areaInfo?.stock ||
                !product.areaInfo?.selling_price ? (
                  <div className={styles.product_stock_container}>
                    {LANG["store.index.no_stock"]}
                  </div>
                ) : (
                  <div className={styles.product_price_container}>
                    {goodDiscountFestival &&
                    product.areaInfo?.product_discount ? (
                      <div>{`${
                        product.areaInfo?.currency_symbol
                      }${formatCurrency(
                        product.areaInfo?.selling_price
                      )}`}</div>
                    ) : null}
                    <div>{`${product.areaInfo?.currency_symbol}${formatCurrency(
                      product.areaInfo?.product_price
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
                        formatCurrency(product.areaInfo?.selling_price) ??
                        99999,
                      priceCurrency: product.areaInfo?.currency ?? "USD",
                    },
                    sku: CONFIG["company.basic.company_name"],
                    mpn: product.key,
                    brand: {
                      "@type": "Brand",
                      name: `${CONFIG["company.basic.company_name"]}`,
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
                        name: `${CONFIG["company.basic.company_name"]}`,
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
          <div className={styles.sort_container} key={index}>
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
