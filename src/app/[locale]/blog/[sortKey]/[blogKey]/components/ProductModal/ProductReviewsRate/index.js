/** @format */

"use client";

import React from "react";
import styles from "./index.module.scss";

const active_icon = `${process.env.NEXT_PUBLIC_FILE}/image/icon/previews_stars_active_icon.svg`;
const no_active_icon = `${process.env.NEXT_PUBLIC_FILE}/image/icon/previews_stars_icon.svg`;

export default function GoodReviewsRate({ reviewNum, reviewScore, LANG }) {
  const number = React.useMemo(() => {
    return reviewNum;
  }, []);

  const score = React.useMemo(() => {
    return reviewScore;
  });

  const rate = React.useMemo(() => {
    return score / 5;
  }, [number, score]);

  if (!number) return;
  return (
    <div className={styles.container}>
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
