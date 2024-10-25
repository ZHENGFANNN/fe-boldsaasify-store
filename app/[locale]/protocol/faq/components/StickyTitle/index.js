/** @format */

"use client";
import styles from "../../page.module.scss";
import React from "react";

export default function StickyTitle({ LANG }) {
  // 处理top
  React.useEffect(() => {
    const $appNavDom = document.getElementById("app-nav");
    const $navSticky = document.getElementsByClassName(
      styles.nav_posity_container
    )[0];
    function scrollFunc() {
      if (document.documentElement.scrollTop > 40 && $navSticky) {
        $navSticky.style.top = `${$appNavDom.offsetHeight - 40}px`;
      } else {
        $navSticky.style.top = `${$appNavDom.offsetHeight}px`;
      }
    }
    scrollFunc();
    window.addEventListener("scroll", scrollFunc);
    return () => {
      window.removeEventListener("scroll", scrollFunc);
    };
  }, []);
  return (
    <div className={styles.nav_posity_container}>
      <h1 className={styles.nav_posity_title}>
        {LANG["www.protocol_faq.content_title"]}
      </h1>
    </div>
  );
}
