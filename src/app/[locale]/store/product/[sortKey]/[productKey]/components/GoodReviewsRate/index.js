"use client";

import React from "react";
import ProductContext from "../../ProductContext";
import styles from "./index.module.scss";

const active_icon = `${process.env.NEXT_PUBLIC_IMAGE}/icon/previews_stars_active_icon.svg`;
const no_active_icon = `${process.env.NEXT_PUBLIC_IMAGE}/icon/previews_stars_icon.svg`;

export default function GoodReviewsRate({ reviewNum, reviewScore }) {
  const { LANG, productInfo } = React.useContext(ProductContext);

  const number = React.useMemo(() => {
    // 参数为先
    if (reviewNum) {
      return reviewNum;
    } else {
      return productInfo.reviewsList?.length;
    }
  }, []);

  const score = React.useMemo(() => {
    // 参数为先
    if (reviewScore) {
      return reviewScore;
    } else {
      const totalScore = productInfo.reviewsList.reduce(
        (pre, cur) => pre + cur.score,
        0
      );
      return totalScore / productInfo.reviewsList?.length;
    }
  });

  const rate = React.useMemo(() => {
    return score / 5;
  }, [number, score]);

  if (!productInfo.reviewsList?.length && !number) return;

  return (
    <div
      className={styles.container}
      data-disabled={productInfo.reviewsList.length < 1}
      onClick={function () {
        if (productInfo.reviewsList.length > 0) {
          const $dom = document.getElementById("product_reviews");
          if ($dom) {
            $dom.scrollIntoView({
              block: "start",
              behavior: "smooth",
            });
          }
        }
      }}
    >
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
          width: 70 * rate,
        }}
      >
        <img alt="active_icon" src={active_icon} />
        <img alt="active_icon" src={active_icon} />
        <img alt="active_icon" src={active_icon} />
        <img alt="active_icon" src={active_icon} />
        <img alt="active_icon" src={active_icon} />
      </div>
      <div className={styles.reviews_text}>{`( ${LANG[
        "store.product.reviews"
      ]?.replace("${num}", number)} )`}</div>
    </div>
  );
}
