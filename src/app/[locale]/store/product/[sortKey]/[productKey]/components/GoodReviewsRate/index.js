"use client";

import React from "react";
import styles from "./index.module.scss";

const active_icon = `${process.env.NEXT_PUBLIC_IMAGE}/icon/previews_stars_active_icon.svg`;
const no_active_icon = `${process.env.NEXT_PUBLIC_IMAGE}/icon/previews_stars_icon.svg`;

export default function GoodReviewsRate({
  LANG,
  configList,
  reviewsNum,
  reviewsScore,
}) {
  const rate = React.useMemo(() => {
    const totalScore = configList.reduce((pre, cur) => {
      return pre + cur.score;
    }, 0);
    return totalScore / configList.length / 5;
  }, [configList]);
  return (
    <div
      className={styles.container}
      data-disabled={configList.length < 1}
      onClick={function () {
        if (configList.length > 0) {
          const $dom = document.getElementById("productReviews");
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
          width: 70 * (rate || reviewsScore / 5),
        }}
      >
        <img alt="active_icon" src={active_icon} />
        <img alt="active_icon" src={active_icon} />
        <img alt="active_icon" src={active_icon} />
        <img alt="active_icon" src={active_icon} />
        <img alt="active_icon" src={active_icon} />
      </div>
      <div className={styles.reviews_text}>
        ({" "}
        {LANG["store.product.reviews"]?.replace(
          "${num}",
          configList.length || reviewsNum
        )}{" "}
        )
      </div>
    </div>
  );
}
