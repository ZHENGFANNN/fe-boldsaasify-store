"use client";

import styles from "../../page.module.scss";
import React from "react";

export default function FaqList({ CONFIG }) {
  const [activity, setActivity] = React.useState();
  // 处理下拉动画
  React.useEffect(() => {
    const $navItemsContainer = document.getElementsByClassName(
      styles.nav_items_container
    );
    if (activity || activity === 0) {
      const $navItems = document.getElementsByClassName(styles.nav_items);
      for (let i = 0; i < $navItemsContainer.length; i++) {
        if (activity === i) {
          $navItemsContainer[activity].style.height =
            $navItems[activity].clientHeight + "px";
        } else {
          $navItemsContainer[i].style.height = 0;
        }
      }
    } else {
      for (let i = 0; i < $navItemsContainer.length; i++) {
        $navItemsContainer[i].style.height = 0;
      }
    }
  }, [activity]);

  return (
    <div className={styles.content_list}>
      <nav className={styles.nav}>
        {/* 导航栏列表 */}
        {Array.isArray(CONFIG["www.protocol.faq"]) &&
          CONFIG["www.protocol.faq"].map((item, index) => {
            return (
              <div key={index} className={styles.nav_list}>
                <p
                  className={styles.nav_title}
                  onClick={() => {
                    if (index === activity) {
                      setActivity(null);
                    } else {
                      setActivity(index);
                    }
                  }}
                >
                  <span>{item.question}</span>
                  <span
                    className={
                      styles.mobile_icon +
                      " " +
                      `${activity === index ? styles.active : ""}`
                    }
                  ></span>
                </p>
                <div className={styles.nav_items_container}>
                  <div className={styles.nav_items}>{item.answer}</div>
                </div>
              </div>
            );
          })}
      </nav>
    </div>
  );
}
