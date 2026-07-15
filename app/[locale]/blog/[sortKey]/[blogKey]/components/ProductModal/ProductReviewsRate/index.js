/** @format */

"use client";

import React from "react";
import styles from "./index.module.scss";
import { StarIcon, StarActiveIcon } from "@/components/Icon";

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
        <StarIcon />
        <StarIcon />
        <StarIcon />
        <StarIcon />
        <StarIcon />
      </div>
      <div
        className={styles.active_stars}
        style={{
          width: 70 * rate,
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
