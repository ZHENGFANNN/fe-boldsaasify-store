import React from "react";
import styles from "./index.module.scss";
import ProductContext from "../../productContext";
import moment from "moment";

const endTime = 1699632000000;

// 格式化时间，保证显示为两位数
function formatTime(time) {
  return time.toString().padStart(2, "0");
}

function updateCountdown(endTime) {
  // 获取目标时间
  const targetTime = moment(endTime);
  // 获取当前时间
  const currentTime = moment();
  // 计算剩余时间
  const duration = moment.duration(targetTime.diff(currentTime));
  // 获取剩余的天、小时和秒数
  const days = Math.floor(duration.asDays());
  const hours = duration.hours();
  const seconds = duration.seconds();
  // 更新倒计时元素的值
  $(`#countdown-day`).text(formatTime(days));
  $(`#countdown-hour`).text(formatTime(hours));
  $(`#countdown-second`).text(formatTime(seconds));
}

export default function Countdown() {
  const { lazyLoading } = React.useContext(ProductContext);
  React.useEffect(() => {
    if (!lazyLoading) {
      const t = setInterval(() => {
        updateCountdown(endTime);
      }, 500);
      return () => {
        clearInterval(t);
      };
    }
  }, []);
  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.price}>
          <div>AED 129</div>
          <div>AED 129</div>
        </div>
        <h2 className={styles.tags}>黑色星期五</h2>
      </div>
      <div className={styles.countdown}>
        <div className={styles.countdown_description}>限时优惠</div>
        <div className={styles.countdown_time}>
          <div className={styles.countdown_item}>
            <div id="countdown-day">00</div>
          </div>
          <div className={styles.countdown_symbol}>:</div>
          <div className={styles.countdown_item}>
            <div id="countdown-hour">00</div>
          </div>
          <div className={styles.countdown_symbol}>:</div>
          <div className={styles.countdown_item}>
            <div id="countdown-second">00</div>
          </div>
        </div>
      </div>
    </div>
  );
}
