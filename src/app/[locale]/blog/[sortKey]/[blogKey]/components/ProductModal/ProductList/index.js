/** @format */

import React from "react";
import Link from "next/link";
import styles from "./index.module.scss";
import { formatCurrency } from "@/utils";

import "@splidejs/splide/css";
import Splide from "@splidejs/splide";
import ProductReviewsRate from "../ProductReviewsRate";

export default function ProductList({ products, goodDiscountFestival, LANG }) {
  const initSplide = React.useCallback(() => {
    const splide = new Splide(`.${styles.splide}`, {
      pagination: false,
      autoplay: true,
      type: "loop",
      arrows: false,
      rewind: true,
      fixedWidth: "220px",
      fixedHeight: "385px",
      interval: 4000,
      pauseOnHover: false,
      padding: {
        left: "calc(50% - 110px)",
        right: "calc(50% - 110px)",
      },
      gap: 12,
    }).mount();

    const $progressList = document.querySelectorAll(
      `.${styles.splide} .${styles.pagination_progress} .${styles.progress_item}`
    );

    $progressList.forEach(function ($dom, index) {
      $dom.addEventListener("click", function () {
        splide.go(index);
      });
    });

    splide.on("move", function (index) {
      $progressList.forEach(function ($dom, progressIndex) {
        if (index === progressIndex) {
          $dom.classList.add(styles.active);
        } else {
          $dom.classList.remove(styles.active);
        }
      });
    });
  }, []);

  React.useEffect(() => {
    initSplide();
  }, []);

  return (
    <div className={styles.container}>
      <div className={`splide ${styles.splide}`}>
        <div className="splide__track">
          <ul className="splide__list">
            {products.map((item, index) => (
              <li className="splide__slide" key={index}>
                <Link href={`/product/${item.sort_key}/${item.key}`}>
                  <div className={styles.splide_item}>
                    <div className={styles.image_container}>
                      <img
                        alt={item.name}
                        className={styles.product_image}
                        src={item.image}
                      />
                    </div>
                    <div className={styles.content_container}>
                      {/* 产品评分 */}
                      {!isNaN(item.reviewScore) ? (
                        <ProductReviewsRate
                          LANG={LANG}
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
                              item.areaInfo?.selling_price,
                              item.areaInfo?.currency_unit
                            )}`}</div>
                          ) : null}
                          <div>{`${
                            item.areaInfo?.currency_symbol
                          }${formatCurrency(
                            item.areaInfo?.product_price,
                            item.areaInfo?.currency_unit
                          )}`}</div>
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
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
    </div>
  );
}
