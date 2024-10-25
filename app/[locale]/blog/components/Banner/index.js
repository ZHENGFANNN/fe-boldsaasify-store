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
  React.useEffect(() => {
    const splide = new Splide(`.${styles.splide}`, {
      type: "loop",
      pauseOnHover: false,
      pauseOnFocus: false,
      autoplay: false,
      arrows: true,
      pagination: true,
      drag: list.length > 1,
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

  return (
    <div className={styles.container}>
      <div className={`splide ${styles.splide}`}>
        <div className="splide__track">
          <ul className="splide__list">
            {list.map((item, index) => (
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
