"use client";

import React from "react";
import styles from "./index.module.scss";
import ProductContext from "../../ProductContext";
import { formatCurrency } from "@/utils";

// 格式化时间，保证显示为两位数
function formatTime(time) {
  return time.toString().padStart(2, "0");
}

function updateCountdown(endTime) {
  if (!endTime) return;
  // 获取当前时间
  const currentTime = Date.now();
  // 计算剩余时间
  const milliseconds = endTime - currentTime;
  if (milliseconds < 0) {
    location.reload();
    return;
  }

  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  // 更新倒计时元素的值
  $(`#countdown-hours`).text(
    Math.max(formatTime(hours), 0).toString().padStart(2, "0")
  );
  $(`#countdown-minutes`).text(
    Math.max(formatTime(minutes % 60), 0)
      .toString()
      .padStart(2, "0")
  );
  $(`#countdown-seconds`).text(
    Math.max(formatTime(seconds % 60), 0)
      .toString()
      .padStart(2, "0")
  );
}

export default function Countdown() {
  const { lazyLoading, productCurCombo, goodDiscountFestival, LANG } =
    React.useContext(ProductContext);
  React.useEffect(() => {
    if (!lazyLoading && !goodDiscountFestival.long_activity) {
      const t = setInterval(() => {
        updateCountdown(goodDiscountFestival?.end_time);
      }, 500);
      return () => {
        clearInterval(t);
      };
    }
  }, [lazyLoading]);
  if (!goodDiscountFestival || !productCurCombo.areaInfo?.product_discount)
    return null;
  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.price}>
          {productCurCombo.areaInfo?.product_price ? (
            <>
              <div>{`${
                productCurCombo.areaInfo.currency_symbol
              }${formatCurrency(
                productCurCombo.areaInfo.selling_price,
                productCurCombo.areaInfo.currency_unit
              )}`}</div>
              <div>{`${
                productCurCombo.areaInfo.currency_symbol
              }${formatCurrency(
                productCurCombo.areaInfo.product_price,
                productCurCombo.areaInfo.currency_unit
              )}`}</div>
            </>
          ) : null}
        </div>
        <h2 className={styles.tags}>
          <span>{goodDiscountFestival.title}</span>
        </h2>
      </div>
      <div className={styles.countdown}>
        {goodDiscountFestival.long_activity ? (
          <div className={styles.countdown_title}>best seller</div>
        ) : null}
        <div className={styles.countdown_description}>
          {LANG["store.product.limit_time_discount"]}
        </div>
        {!goodDiscountFestival.long_activity ? (
          <div className={styles.countdown_time}>
            <div className={styles.countdown_item}>
              <div id="countdown-hours">00</div>
            </div>
            <div className={styles.countdown_symbol}>:</div>
            <div className={styles.countdown_item}>
              <div id="countdown-minutes">00</div>
            </div>
            <div className={styles.countdown_symbol}>:</div>
            <div className={styles.countdown_item}>
              <div id="countdown-seconds">00</div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
