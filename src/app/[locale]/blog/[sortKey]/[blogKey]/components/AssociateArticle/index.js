/** @format */

"use client";
import styles from "./index.module.scss";
import React from "react";
import { formateTime } from "../../../../utils";
import Link from "next/link";

function ArticleCard({ item, locale }) {
  return (
    <Link
      scroll={true}
      href={`/blog/${item.sort_key}/${item.key}`}
      className={styles.card}
    >
      <div className={styles.img_wrapper}>
        <img src={item.image} alt={item.title} />
      </div>
      <div className={styles.article_title}>{item.title}</div>
      <div className={styles.article_info}>
        <div className={styles.article_info_time}>
          {formateTime({ time: item.updated_time, locale })}
        </div>
      </div>
    </Link>
  );
}

export default function AssociateArticle({ articleList, locale }) {
  const [showArrow, setShowArrow] = React.useState(false);
  const [active, setActive] = React.useState(0);

  const initList = React.useCallback(() => {
    if (!articleList || articleList.length === 0) return;
    const itemWidth =
      document.querySelector(`.${styles.card}`)?.offsetWidth + 20;
    const $scrollDom = document.querySelector(`.${styles.scroll_container}`);
    const $listDom = document.querySelector(`.${styles.list}`);
    const computedWidth = function () {
      const index = Math.ceil($scrollDom.scrollLeft / itemWidth);
      setActive(index);
      // 计算出最后的（误差）
      const containerWidth = Math.min(1200, window.innerWidth);
      if (
        Math.abs(
          $scrollDom.scrollLeft +
            containerWidth -
            itemWidth * articleList.length
        ) < 100 &&
        $scrollDom.scrollLeft !== 0
      ) {
        setActive(articleList.length);
      }
    };

    // 判断屏幕是否大于列表
    const windowWidth = Math.min(window.innerWidth - 32, 1200);
    const listWidth = $listDom.offsetWidth;
    if (listWidth > windowWidth) {
      setShowArrow(true);
    } else {
      setShowArrow(false);
    }
    computedWidth();
    $scrollDom.addEventListener("scroll", computedWidth);
    return () => $scrollDom.removeEventListener("scroll", computedWidth);
  }, [articleList]);

  React.useEffect(() => {
    initList();
  }, []);

  return (
    <div className={styles.container}>
      <div className={styles.title}>You May Also Like</div>
      <div className={styles.scroll_container}>
        <div className={styles.list_container}>
          <div className={styles.list}>
            {articleList.map((item, index) => {
              return <ArticleCard key={index} item={item} locale={locale} />;
            })}
          </div>
        </div>
      </div>
      {/* 箭头按钮 */}
      <div
        className={`${styles.arrow_container} ${
          !showArrow ? styles.display_none : ""
        }`}
      >
        <button
          onClick={() => {
            if (active === 0) return;
            const $dom = document.querySelector(`.${styles.scroll_container}`);
            const itemWidth =
              document.querySelector(`.${styles.card}`)?.offsetWidth + 20;

            const left = $dom.scrollLeft;
            $dom.scrollTo({
              left: left - itemWidth,
            });
          }}
          className={`${styles.pre} ${active === 0 ? styles.opacity_0 : ""}`}
        >
          <svg width="16" height="16" aria-hidden="true">
            <path
              className="btn-svg"
              d="M9.917 3c.39.391.39 1.025 0 1.416L6.34 8l3.578 3.584c.39.391.39 1.025 0 1.416L5.278 8.354a.501.501 0 0 1 0-.708L9.918 3Z"
              fill="#000"
              fillRule="evenodd"
              fillOpacity="0.85"
            ></path>
          </svg>
        </button>
        <button
          onClick={() => {
            if (active === articleList.length) return;
            const $dom = document.querySelector(`.${styles.scroll_container}`);
            const itemWidth =
              document.querySelector(`.${styles.card}`)?.offsetWidth + 20;

            const left = $dom.scrollLeft;
            $dom.scrollTo({
              left: left + itemWidth,
            });
          }}
          className={`${styles.next} ${
            active === articleList.length ? styles.opacity_0 : ""
          }`}
        >
          <svg width="16" height="16" aria-hidden="true">
            <path
              className="btn-svg"
              fillOpacity="0.85"
              fillRule="evenodd"
              fill="#000"
              d="M6.105 13a1.002 1.002 0 0 1 0-1.416L9.684 8 6.105 4.416a1.002 1.002 0 0 1 0-1.416l4.64 4.646a.501.501 0 0 1 0 .708L6.104 13Z"
            ></path>
          </svg>
        </button>
      </div>
    </div>
  );
}
