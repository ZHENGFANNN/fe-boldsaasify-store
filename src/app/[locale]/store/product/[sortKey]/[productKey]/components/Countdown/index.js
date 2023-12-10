"use client";

import React from "react";
import styles from "./index.module.scss";
import ProductContext from "../../productContext";
import useProductStore from "../../productStore";

// 格式化时间，保证显示为两位数
function formatTime(time) {
  return time.toString().padStart(2, "0");
}

function updateCountdown(endTime) {
  // 获取当前时间
  const currentTime = Date.now();
  // 计算剩余时间
  const milliseconds = endTime - currentTime;

  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  // 更新倒计时元素的值
  $(`#countdown-hours`).text(formatTime(hours));
  $(`#countdown-minutes`).text(formatTime(minutes % 60));
  $(`#countdown-seconds`).text(formatTime(seconds % 60));
}

export default function Countdown({ goodDiscountFestival }) {
  if (!goodDiscountFestival) return null;
  const { lazyLoading } = React.useContext(ProductContext);
  const productCurCombo = useProductStore((state) => state.productCurCombo);
  React.useEffect(() => {
    if (!lazyLoading) {
      const t = setInterval(() => {
        updateCountdown(goodDiscountFestival.end_time);
      }, 500);
      return () => {
        clearInterval(t);
      };
    }
  }, [lazyLoading]);
  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.price}>
          {productCurCombo.areaInfo.price ? (
            <>
              {" "}
              <div>{`${productCurCombo.areaInfo.currency_symbol}${
                productCurCombo.areaInfo.currency
              } ${Math.floor(
                productCurCombo.areaInfo.price *
                  goodDiscountFestival.discount *
                  0.01
              )}`}</div>
              <div>{`${productCurCombo.areaInfo.currency_symbol}${productCurCombo.areaInfo.currency} ${productCurCombo.areaInfo.price}`}</div>
            </>
          ) : null}
        </div>
        <h2 className={styles.tags}>
          <span>{goodDiscountFestival.title}</span>
        </h2>
      </div>
      <div className={styles.countdown}>
        <div className={styles.countdown_description}>限时优惠</div>
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
      </div>
    </div>
  );
}
