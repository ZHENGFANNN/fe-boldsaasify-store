"use client";

import React from "react";
import styles from "./index.module.scss";

const icon = (
  <svg
    t="1704599843888"
    viewBox="0 0 1024 1024"
    version="1.1"
    xmlns="http://www.w3.org/2000/svg"
    p-id="4103"
  >
    <path
      d="M355.311867 284.743136c-7.850805 14.637372-19.662829 24.142863-32.103162 25.439392l-184.815239 26.808576c-71.235414 11.852956-99.348706 100.665701-48.545646 153.520489l132.893706 133.797285c10.69662 11.132548 15.771195 26.13831 13.153578 39.73498l-32.175817 189.679014c-11.405771 74.114998 62.659085 130.251529 125.444037 94.620008l164.348092-88.808652c13.325493-7.68503 26.862811-7.68503 39.656185-0.303922l165.261904 89.332585c62.405305 35.411511 136.467091-20.72502 125.124765-94.490048l-32.148188-189.539844c-1.36509-14.81952 3.432169-30.203906 13.317307-40.483017l132.392286-133.285632c51.05377-53.109592 22.940478-141.921313-47.869241-153.706731l-184.41308-26.770713c-14.672164-3.094478-27.389814-12.599969-32.615838-24.836665l-81.610716-174.309978c-31.227212-67.913762-122.773208-67.913762-154.068981 0.144286L355.311867 284.743136 355.311867 284.743136zM355.311867 284.743136"
      p-id="4104"
    ></path>
  </svg>
);

export default function GoodReviewsRate({ LANG, configList }) {
  const icons = [icon, icon, icon, icon, icon];
  const rate = React.useMemo(() => {
    const totalScore = configList.reduce((pre, cur) => {
      return pre + cur.score;
    }, 0);
    return totalScore / configList.length / 5;
  }, [configList]);
  return (
    <div
      className={styles.container}
      onClick={function () {
        const $dom = document.getElementById("productReviews");
        if ($dom) {
          location.href = "#productReviews";
          // $dom.scrollIntoView({
          //   block: "start",
          //   behavior: "smooth",
          // });
        }
      }}
    >
      <div className={styles.no_active_stars}>
        {icons.map((item, index) => (
          <div key={index}>{item}</div>
        ))}
      </div>
      <div
        className={styles.active_stars}
        style={{
          width: 70 * rate,
        }}
      >
        {icons.map((item, index) => (
          <div key={index}>{item}</div>
        ))}
      </div>
      <div className={styles.reviews_text}>
        ( {LANG["store.product.reviews"]?.replace("${num}", configList.length)}{" "}
        )
      </div>
    </div>
  );
}
