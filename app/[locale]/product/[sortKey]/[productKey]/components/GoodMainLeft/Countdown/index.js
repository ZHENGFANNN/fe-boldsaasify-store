"use client";

import React from "react";
import styles from "./index.module.scss";
import ProductContext from "../../../ProductContext";
import { formatCurrency } from "@/utils";
import { discountedUnitPrice } from "@/utils/productPricing";

// 格式化时间，保证显示为两位数
function formatTime(time) {
  return time.toString().padStart(2, "0");
}

function updateCountdown(endTime, onExpire) {
  if (!endTime) return;
  // 获取当前时间
  const currentTime = Date.now();
  // 计算剩余时间（endTime 为毫秒时间戳）
  const milliseconds = endTime - currentTime;
  if (milliseconds < 0) {
    // 到点：局部隐藏（与列表页 CardCountdown 一致），不整页 reload。
    if (typeof onExpire === "function") onExpire();
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
  // 自动规则折扣（限时促销），来自 ProductContext：
  //   { value, value_type, ends_at(毫秒戳), title }
  // 由 BaseLayout 调接口 A getProductDiscounts(单商品) 注入；setAutoDiscount 供到点局部隐藏。
  const { lazyLoading, productCurCombo, LANG, autoDiscount, setAutoDiscount } =
    React.useContext(ProductContext);

  // 显示条件：只要有商品自动折扣就展示模块；ends_at 仅决定是否渲染倒计时。
  const active = !!autoDiscount;
  const hasCountdown = active && !!autoDiscount.ends_at;

  React.useEffect(() => {
    if (lazyLoading || !hasCountdown) return;
    const endTime = Number(autoDiscount.ends_at);
    const onExpire = () => {
      // 到点：清空 ends_at 以隐藏倒计时，但保留 autoDiscount 让模块继续显示（无倒计时形态）。
      if (typeof setAutoDiscount === "function") {
        setAutoDiscount({ ...autoDiscount, ends_at: 0 });
      }
    };
    // 进入即刷一次，避免首帧停留 00:00:00
    updateCountdown(endTime, onExpire);
    const t = setInterval(() => {
      updateCountdown(endTime, onExpire);
    }, 500);
    return () => {
      clearInterval(t);
    };
  }, [lazyLoading, hasCountdown, autoDiscount, setAutoDiscount]);

  // 无折扣：不渲染
  if (!active) {
    return null;
  }

  const areaInfo = productCurCombo?.areaInfo;
  // NaN 防御：value 缺省时归一化为 0，避免渲染出 $NaN。
  const discountValue = Number(autoDiscount.value) || 0;
  // 折扣标签文案：percent → "X% OFF"，fixed → 减额（带币种）。
  const discountLabel =
    autoDiscount.value_type === "percent"
      ? `${discountValue}% ${LANG["store.product.off"] || "OFF"}`
      : areaInfo
      ? `-${areaInfo.currency_symbol}${formatCurrency(
          discountValue,
          areaInfo.currency_unit
        )}`
      : `-${discountValue}`;

  // 折后价与详情页价格区/Footer 保持同一口径（见 utils/productPricing.discountedUnitPrice）。
  const discountedPrice = discountedUnitPrice(areaInfo, autoDiscount);

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        {areaInfo?.product_price ? (
          <div className={styles.price}>
            <div>{`${areaInfo.currency_symbol}${formatCurrency(
              discountedPrice,
              areaInfo.currency_unit
            )}`}</div>
            <div>{`${areaInfo.currency_symbol}${formatCurrency(
              areaInfo.product_price,
              areaInfo.currency_unit
            )}`}</div>
          </div>
        ) : null}
        <h2 className={styles.tags}>
          <span>{autoDiscount.title || discountLabel}</span>
        </h2>
      </div>
      <div className={styles.countdown}>
        <div className={styles.countdown_description}>
          {LANG["store.product.limit_time_discount"] || "限时促销"}
        </div>
        {hasCountdown ? (
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
