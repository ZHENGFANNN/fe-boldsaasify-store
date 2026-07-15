"use client";

import React from "react";
import ProductContext from "../../../ProductContext";
import styles from "./index.module.scss";
import { StarIcon, StarActiveIcon } from "@/components/Icon";

export default function GoodReviewsRate({ reviewNum, reviewScore }) {
  const { LANG, productInfo } = React.useContext(ProductContext);
  const reviewsList = Array.isArray(productInfo.reviewsList)
    ? productInfo.reviewsList
    : [];

  const number = React.useMemo(() => {
    // 参数为先
    if (reviewNum) {
      return reviewNum;
    } else {
      return productInfo.reviews_num || reviewsList.length;
    }
  }, [reviewNum, productInfo.reviews_num, reviewsList.length]);

  const score = React.useMemo(() => {
    // 参数为先
    if (reviewScore) {
      return reviewScore;
    } else {
      const totalScore = reviewsList.reduce((pre, cur) => pre + cur.score, 0);
      return (
        productInfo.reviews_score ||
        (reviewsList.length > 0 ? totalScore / reviewsList.length : 0)
      );
    }
  }, [reviewScore, productInfo.reviews_score, reviewsList]);

  const rate = React.useMemo(() => {
    return score / 5;
  }, [number, score]);

  if (!reviewsList.length && !number) return;

  return (
    <div
      className={styles.container}
      data-disabled={reviewsList.length < 1}
      data-event="ProductReviews"
      onClick={function () {
        if (reviewsList.length > 0) {
          const $dom = document.getElementById("product_reviews");
          if ($dom) {
            $dom.scrollIntoView({
              block: "start",
              behavior: "smooth"
            });
          }
        }
      }}
    >
      <div className={styles.no_active_stars}>
        <StarIcon />
        <StarIcon />
        <StarIcon />
        <StarIcon />
        <StarIcon />
      </div>
      <div
        className={styles.active_stars}
        style={{
          width: 70 * rate
        }}
      >
        <StarActiveIcon />
        <StarActiveIcon />
        <StarActiveIcon />
        <StarActiveIcon />
        <StarActiveIcon />
      </div>
      <div className={styles.reviews_text}>{`( ${LANG[
        "store.product.reviews"
      ]?.replace("${num}", number)} )`}</div>
    </div>
  );
}
