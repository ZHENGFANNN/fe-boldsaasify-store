/** @format */

"use client";

import Splide from "@splidejs/splide";
import "@splidejs/splide/css";
import React from "react";

import styles from "./index.module.scss";
import "./index.scss";
import Link from "next/link";

export default function Banner({ list }) {
  const [active, setActive] = React.useState(0);
  // 没封面的文章不进轮播：空 src 会被解析成当前页 URL，渲染成破图。
  // 在 effect 与渲染之前先过滤，保证 Splide 的 slide 数与实际渲染一致。
  const slides = React.useMemo(
    () => (list || []).filter((x) => x && x.image),
    [list]
  );
  React.useEffect(() => {
    if (!slides.length) return;
    const splide = new Splide(`.${styles.splide}`, {
      type: "loop",
      pauseOnHover: false,
      pauseOnFocus: false,
      autoplay: false,
      arrows: true,
      pagination: true,
      drag: slides.length > 1,
      interval: 4000,
      padding: {
        left: "calc(50% - 433.5px)",
        right: "calc(50% - 433.5px)",
      },
    });
    splide.on("move", (e) => {
      setActive(e);
    });
    splide.mount();
  }, []);

  if (!slides.length) return null;

  return (
    <div className={styles.container}>
      <div className={`splide ${styles.splide}`}>
        <div className="splide__track">
          <ul className="splide__list">
            {slides.map((item, index) => (
              <li
                data-active={active === index}
                className={`splide__slide ${styles.splide_item_container}`}
                key={index}
              >
                <Link
                  scroll={true}
                  href={`/blog/${item.sort_key}/${item.key}`}
                  className={styles.splide_item}
                >
                  <div className={styles.image_container}>
                    <img alt={item.title} src={item.image} />
                  </div>
                  <div className={styles.text_container}>{item.title}</div>
                  <div className={styles.mask}></div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
