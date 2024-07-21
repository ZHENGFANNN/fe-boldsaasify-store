/** @format */

"use client";
import React from "react";
import styles from "./index.module.scss";
import { debounce } from "@/utils/index";

export default function ArticleInfo({ headTitleList }) {
  const navRef = React.useRef(null);
  const [isExpand, setIsExpand] = React.useState(true);

  React.useEffect(() => {
    if (navRef.current) {
      if (window.innerWidth <= 1180) return;
      const $navItemList = navRef.current?.querySelectorAll("[data-tag]");
      const $domList = document.querySelectorAll(
        "#blog-article-content-html h2,h3"
      );
      const scrollEvent = debounce(function () {
        if (!navRef.current) return;
        const scrollTop =
          (document.body.scrollTop || document.documentElement.scrollTop) - 36;

        for (let i = 0; i < $domList.length; i++) {
          const curDomTop = $domList[i].offsetTop;
          const nextDomTop =
            $domList[i + 1]?.offsetTop || document.body.offsetHeight;

          if (
            (scrollTop > curDomTop && scrollTop < nextDomTop) ||
            (scrollTop < curDomTop && i === 0)
          ) {
            const currentActiveNavList =
              navRef.current.querySelectorAll("[data-active]");
            if (currentActiveNavList) {
              currentActiveNavList.forEach((item) => {
                item.removeAttribute("data-active");
              });
            }
            $navItemList[i].setAttribute("data-active", "true");
            break;
          }
        }
      }, 50);
      scrollEvent();
      window.addEventListener("scroll", scrollEvent);
      return () => window.removeEventListener("scroll", scrollEvent);
    }
  }, []);

  if (headTitleList.length < 1) return;
  return (
    <div className={styles.container} ref={navRef} data-expand={isExpand}>
      <div className={styles.content}>
        <div
          className={styles.expand_icon}
          onClick={() => setIsExpand((state) => !state)}
        >
          {isExpand ? (
            <img
              src={`${process.env.NEXT_PUBLIC_FILE}/image/icon/blog-expand-icon.svg`}
            />
          ) : (
            <img
              src={`${process.env.NEXT_PUBLIC_FILE}/image/icon/blog-collaspe-icon.svg`}
            />
          )}
        </div>
        <div className={styles.header_container}>
          {headTitleList.map((item, index) => {
            return (
              <a
                href={`#${item.id}`}
                key={index}
                data-tag={item.tag}
                className={[styles.header, styles[item.tag]].join(" ")}
              >
                {item.content}
              </a>
            );
          })}
        </div>
      </div>
    </div>
  );
}
