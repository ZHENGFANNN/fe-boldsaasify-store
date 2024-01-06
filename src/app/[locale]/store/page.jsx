import styles from "./page.module.scss";
import React from "react";

import Advantage from "@/components/Layout/Advantage";
import getAllConfigData from "@/utils/getAllConfigData";

import Script from "next/script";
import Banner from "./components/Banner";

import { cookies } from "next/headers";
import Link from "next/link";

export const runtime = "edge";

async function getSortList({ productSort, area }) {
  return productSort.map((item) => {
    const goodList = item.goodList.map((good) => {
      const areaInfo =
        good.comboList[0]?.areaList?.find((item) => {
          return item.country_code === area;
        }) ?? {};
      return {
        ...good,
        areaInfo,
      };
    });
    // 商品数量限制
    if (goodList.length > 11 && !item.video_src) goodList.length = 11;
    if (goodList.length > 17 && item.video_src) goodList.length = 17;
    return {
      ...item,
      goodList,
    };
  });
}

export async function generateMetadata({ params: { locale } }) {
  const { LANG, CONFIG } = await getAllConfigData(locale);
  return {
    title: `${CONFIG["company.basic.company_name"]} - ${LANG["store.index.title"]}`,
    description: LANG["store.index.description"],
    keywords: LANG["store.index.keywords"],
  };
}

function ProductInfo({ product, productIndex, LANG, goodDiscountFestival }) {
  return (
    <Link
      href={`/store/product/${product.sort_key}/${product.key}`}
      className={`${styles.goods_items} ${
        productIndex === 0 ? styles.big_item : ""
      }`}
    >
      <div
        className={`${styles.infos_container} ${
          !product.image_scenes ? styles.hover_big : ""
        }`}
      >
        <div className={styles.mask_top}></div>
        <div className={styles.mask_bottom}></div>

        {goodDiscountFestival && product.areaInfo.good_discount ? (
          <div className={styles.good_discount}>
            <div className={styles.off}>OFF</div>
            <div className={styles.discount}>
              {100 - product.areaInfo.good_discount}%
            </div>
          </div>
        ) : null}

        <div className={styles.title}>
          <h3>{product.name}</h3>
          {!product.areaInfo.stock ? (
            <span className={styles.stock_tip}>
              {LANG["store.index.no_stock"]}
            </span>
          ) : null}
          {goodDiscountFestival &&
          product.areaInfo.good_discount &&
          product.areaInfo.price ? (
            <span className={styles.discount_tip}>{`- ${
              product.areaInfo.currency_symbol
            }${product.areaInfo.currency} ${Math.ceil(
              product.areaInfo.price *
                (100 - product.areaInfo.good_discount) *
                0.01
            )}`}</span>
          ) : null}
        </div>
        <div className={styles.goods_item_price}>
          {product.areaInfo.price ? (
            <div className={styles.price_container}>
              {goodDiscountFestival && product.areaInfo.good_discount ? (
                <div>{`${product.areaInfo.currency_symbol}${
                  product.areaInfo.currency
                } ${Math.floor(
                  product.areaInfo.price * product.areaInfo.good_discount * 0.01
                )}`}</div>
              ) : null}
              <div>{`${product.areaInfo.currency_symbol}${product.areaInfo.currency}  ${product.areaInfo.price}`}</div>
            </div>
          ) : (
            <div>-</div>
          )}
          {product.areaInfo.price ? (
            <div>+</div>
          ) : (
            <div className={styles.stock_tip}>
              {LANG["store.index.no_stock"]}
            </div>
          )}
        </div>
      </div>
      <div className={styles.img_container}>
        <div
          className={`${styles.goods_item_img} ${
            !product.image_scenes ? styles.hover_big : ""
          }`}
        >
          <img alt={product.name} src={product.image_url} />
        </div>
        {product.image_scenes ? (
          <div className={styles.goods_item_hover_img}>
            <img alt={product.name} src={product.image_scenes} />
          </div>
        ) : null}
      </div>
    </Link>
  );
}

export default async function Home({ params: { locale } }) {
  const area = cookies().get("area")?.value || "us";
  const { CONFIG, LANG, GOODSORTLIST, GOODDISCOUNTFESTIVAL } =
    await getAllConfigData(locale);
  const sortList = await getSortList({
    productSort: GOODSORTLIST,
    locale,
    area,
  });

  return (
    <main className={styles.container}>
      <Banner CONFIG={CONFIG} LANG={LANG} />
      {sortList.map((item, index) => {
        return (
          <div className={styles.sort_container} key={index}>
            <div className={styles.sort_header}>
              <h2>{item.name}</h2>
              {(item.goodList.length > 10 && !item.video_src) ||
              (item.goodList.length > 16 && item.video_src) ? (
                <div
                  className={styles.more}
                  onClick={() => {
                    window.location.href = `/${locale}/nav/${item.key}`;
                  }}
                >
                  <div>{LANG["store.index.learn_more"]}</div>
                  <div className={styles.arrow_icon}></div>
                </div>
              ) : null}
            </div>
            <section className={styles.goods_container} key={index}>
              {item.video_src ? (
                <div className={styles.video_item_mob}>
                  <video
                    loop
                    autoPlay
                    playsInline
                    muted
                    poster={item.video_cover}
                    src={item.video_src}
                  />
                </div>
              ) : null}
              {item.goodList.map((product, productIndex) => {
                return (
                  <React.Fragment key={productIndex}>
                    {productIndex === 1 && item.video_cover ? (
                      <div className={styles.video_item_pc}>
                        <video
                          loop
                          autoPlay
                          playsInline
                          muted
                          poster={item.video_cover}
                          src={item.video_src}
                        />
                      </div>
                    ) : null}
                    <ProductInfo
                      locale={locale}
                      LANG={LANG}
                      product={product}
                      productIndex={productIndex}
                      goodDiscountFestival={GOODDISCOUNTFESTIVAL}
                    />
                    <Script
                      key={productIndex}
                      id={`store-index-ld-json-${productIndex}`}
                      type="application/ld+json"
                      dangerouslySetInnerHTML={{
                        __html: JSON.stringify(
                          {
                            "@context": "https://schema.org/",
                            "@type": "Product",
                            name: product.name,
                            image: [product.image_url],
                            description: product.description,
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
                            // review: {
                            //   '@type': ' Organization',
                            //   reviewRating: {
                            //     '@type': 'Rating',
                            //     ratingValue: 5,
                            //     bestRating: 5,
                            //   },
                            //   author: {
                            //     '@type': 'Organization',
                            //     name: `${CONFIG['company.basic.company_name']}`,
                            //   },
                            // },
                          },
                          null,
                          "\t"
                        ),
                      }}
                    />
                  </React.Fragment>
                );
              })}
              {(item.goodList.length > 10 && !item.video_src) ||
              (item.goodList.length > 16 && item.video_src) ? (
                <a href={`/${locale}/nav/${item.key}`} className={styles.more}>
                  <div>{LANG["store.index.learn_more"]}</div>
                  <div className={styles.arrow_icon}></div>
                </a>
              ) : null}
            </section>
          </div>
        );
      })}
      <Advantage LANG={LANG} />
    </main>
  );
}
