import React from "react";
import Script from "next/script";
import styles from "./index.module.scss";
import Link from "next/link";
const active_icon = `${process.env.NEXT_PUBLIC_IMAGE}/icon/previews_stars_active_icon.svg`;
const no_active_icon = `${process.env.NEXT_PUBLIC_IMAGE}/icon/previews_stars_icon.svg`;
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

export default function ProductList({
  CONFIG,
  LANG,
  goodList,
  goodDiscountFestival,
}) {
  return (
    <section className={styles.goods_container}>
      {goodList.map((product, productIndex) => {
        return (
          <>
            <React.Fragment key={productIndex}>
              <Link
                href={`/store/product/${product.sort_key}/${product.key}`}
                className={styles.goods_item}
              >
                <div className={styles.image_container}>
                  <img alt={product.name} src={product.image_list[0].src} />
                </div>
                <div className={styles.content_container}>
                  {/* 产品评分 */}
                  {!isNaN(product.reviewScore) ? (
                    <ReviewRate
                      LANG={LANG}
                      reviewsNum={product.reviewsList.length}
                      reviewScore={product.reviewScore}
                    />
                  ) : null}

                  {/* 产品名称 */}
                  <h3 className={styles.product_name}>{product.name}</h3>
                  {/* 产品优惠 */}
                  {goodDiscountFestival && product.areaInfo.good_discount ? (
                    <div className={styles.good_discount_container}>
                      <div className={styles.off}>
                        {LANG["store.index.off"]}
                      </div>
                      <div className={styles.discount}>
                        {100 - product.areaInfo.good_discount}%
                      </div>
                    </div>
                  ) : null}
                  {/* 产品价格 */}
                  {!product.areaInfo.stock || !product.areaInfo.price ? (
                    <div className={styles.product_stock_container}>
                      {LANG["store.index.no_stock"]}
                    </div>
                  ) : (
                    <div className={styles.product_price_container}>
                      {goodDiscountFestival &&
                      product.areaInfo.good_discount ? (
                        <div>{`${product.areaInfo.currency_symbol}${
                          product.areaInfo.currency
                        } ${Math.floor(
                          product.areaInfo.price *
                            product.areaInfo.good_discount *
                            0.01
                        )}`}</div>
                      ) : null}
                      <div>{`${product.areaInfo.currency_symbol}${product.areaInfo.currency}  ${product.areaInfo.price}`}</div>
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
                        price: product.areaInfo.price ?? 99999,
                        priceCurrency: product.areaInfo.currency ?? "USD",
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
                          bestRating: product.reviewScore,
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
          </>
        );
      })}
    </section>
  );
}
