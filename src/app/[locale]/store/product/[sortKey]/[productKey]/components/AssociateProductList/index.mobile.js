"use client";

import React from "react";
import "@splidejs/splide/css";
import Splide from "@splidejs/splide";

import formatCurrency from "@/utils/formatCurrency";

import ProductContext from "../../ProductContext";
import { lazyLoadImages } from "@/utils/optimization";

import styles from "./index.mobile.module.scss";
import Image from "@/components/Image";
import GoodReviewsRate from "../GoodReviewsRate";

export default function MobProductList({
  LANG,
  goodDiscountFestival,
  products,
}) {
  const { lazyLoading } = React.useContext(ProductContext);
  const initSplide = React.useCallback(() => {
    const splide = new Splide(`.${styles["splide-mobile"]}`, {
      pagination: false,
      autoplay: true,
      type: "loop",
      arrows: false,
      rewind: true,
      fixedWidth: "303px",
      fixedHeight: "485px",
      interval: 4000,
      pauseOnHover: false,
      padding: {
        left: "calc(50% - 151.5px)",
        right: "calc(50% - 151.5px)",
      },
      gap: 12,
    }).mount();

    const $progressList = $(
      `.${styles["splide-mobile"]} .${styles.pagination_progress}`
    ).find(`.${styles.progress_item}`);

    $progressList.on("click", function () {
      const index = $(this).index();
      splide.go(index);
    });

    splide.on("move", function (index) {
      $progressList.each(function (progressIndex) {
        if (index === progressIndex) {
          $(this).addClass(styles.active);
        } else {
          $(this).removeClass(styles.active);
        }
      });
    });
  }, []);

  React.useEffect(() => {
    if (!lazyLoading) {
      initSplide();

      const cleanLazy = lazyLoadImages($(`.${styles.associate_product}`));
      return () => cleanLazy();
    }
  }, [lazyLoading]);
  return (
    <section className={styles.associate_product}>
      <div className={styles.title}>{LANG["store.product.maybe_you_like"]}</div>
      <div className={`splide ${styles["splide-mobile"]}`}>
        <div className="splide__track">
          <ul className="splide__list">
            {products.map((item, index) => (
              <li className="splide__slide" key={index}>
                <a href={`/store/product/${item.sort_key}/${item.key}`}>
                  <div className={styles.splide_item}>
                    <div className={styles.image_container}>
                      <Image
                        alt={item.name}
                        className={styles.product_image}
                        src={item.image}
                      />
                    </div>
                    <div className={styles.content_container}>
                      {/* 产品评分 */}
                      {!isNaN(item.reviewScore) ? (
                        <GoodReviewsRate
                          reviewNum={item.reviewsNum}
                          reviewScore={item.reviewScore}
                        />
                      ) : null}
                      {/* 产品名称 */}
                      <div className={styles.product_name}>{item.name}</div>
                      {/* 产品优惠 */}
                      {goodDiscountFestival &&
                      item.areaInfo?.product_discount ? (
                        <div className={styles.good_discount_container}>
                          <div className={styles.off}>
                            {LANG["store.product.off"]}
                          </div>
                          <div className={styles.discount}>
                            {100 - item.areaInfo?.product_discount}%
                          </div>
                        </div>
                      ) : null}
                      {/* 产品价格 */}
                      {!item.areaInfo?.stock ||
                      !item.areaInfo?.selling_price ? (
                        <div className={styles.product_stock_container}>
                          {LANG["store.product.no_stock"]}
                        </div>
                      ) : (
                        <div className={styles.product_price_container}>
                          {goodDiscountFestival &&
                          item.areaInfo?.product_discount ? (
                            <div>{`${
                              item.areaInfo?.currency_symbol
                            }${formatCurrency(
                              item.areaInfo?.selling_price
                            )}`}</div>
                          ) : null}
                          <div>{`${
                            item.areaInfo?.currency_symbol
                          }${formatCurrency(
                            item.areaInfo?.product_price
                          )}`}</div>
                        </div>
                      )}
                    </div>
                  </div>
                </a>
              </li>
            ))}
          </ul>
        </div>
        {products.length > 1 ? (
          <div className={styles.pagination_progress}>
            {products.map((_, index) => {
              return (
                <div
                  className={`${styles.progress_item} ${
                    index === 0 ? styles.active : ""
                  }`}
                  key={index}
                >
                  <svg
                    className={styles.default_svg}
                    version="1.1"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 36 36"
                    preserveAspectRatio="none"
                  >
                    <circle
                      cx="18"
                      cy="18"
                      r="15.915494309189533"
                      fill="inherit"
                      stroke="inherit"
                      strokeDashoffset="inherit"
                      strokeWidth="4"
                      strokeLinecap="round"
                      strokeDasharray="100 100"
                    ></circle>
                  </svg>
                  <svg
                    className={styles.active_svg}
                    version="1.1"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 36 36"
                    preserveAspectRatio="none"
                  >
                    <circle
                      cx="18"
                      cy="18"
                      r="15.915494309189533"
                      fill="inherit"
                      stroke="inherit"
                      strokeDashoffset="inherit"
                      strokeWidth="4"
                      strokeLinecap="round"
                      strokeDasharray="100 100"
                    ></circle>
                  </svg>
                </div>
              );
            })}
          </div>
        ) : null}
      </div>
    </section>
  );
}
