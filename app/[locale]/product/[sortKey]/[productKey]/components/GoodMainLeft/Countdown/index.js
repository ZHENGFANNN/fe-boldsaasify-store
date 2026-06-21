"use client";

import React from "react";
import styles from "./index.module.scss";
import ProductContext from "../../../ProductContext";
import { formatCurrency } from "@/utils";

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

  // 守卫：有 ends_at 才视为有效限时折扣（BaseLayout 注入前已过滤掉过期项，
  // 运行期过期由 updateCountdown 检测到剩余<0 时调 onExpire 局部隐藏）。在 render 内
  // 不调用 Date.now() 这类非纯函数，过期判断交给 effect。
  const active = !!autoDiscount && !!autoDiscount.ends_at;

  React.useEffect(() => {
    if (lazyLoading || !active) return;
    const endTime = Number(autoDiscount.ends_at);
    const onExpire = () => {
      if (typeof setAutoDiscount === "function") setAutoDiscount(null);
    };
    // 进入即刷一次，避免首帧停留 00:00:00
    updateCountdown(endTime, onExpire);
    const t = setInterval(() => {
      updateCountdown(endTime, onExpire);
    }, 500);
    return () => {
      clearInterval(t);
    };
  }, [lazyLoading, active, autoDiscount?.ends_at, setAutoDiscount]);

  // 无折扣：不渲染（过期由 updateCountdown 调 onExpire 局部隐藏）。
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

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        {areaInfo?.product_price ? (
          <div className={styles.price}>
            <div>{`${areaInfo.currency_symbol}${formatCurrency(
              areaInfo.selling_price,
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
          {LANG["store.product.limit_time_discount"]}
        </div>
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
