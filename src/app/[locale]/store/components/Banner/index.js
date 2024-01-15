"use client";

import styles from "./index.module.scss";
import Splide from "@splidejs/splide";
import "@splidejs/splide/css";
import React from "react";
import { useRouter } from "next/navigation";

export default function Banner({ CONFIG, LANG }) {
  const router = useRouter();
  const [splide, setSplide] = React.useState();
  const [active, setActive] = React.useState(0);
  const bannerList = React.useMemo(() => {
    return CONFIG["store.index.banner"];
  }, []);
  React.useEffect(() => {
    const splide = new Splide(`.${styles.splide}`, {
      type: "loop",
      pauseOnHover: false,
      pauseOnFocus: false,
      autoplay: true,
      arrows: false,
      pagination: false,
      drag: bannerList.length > 1,
      width: "100%",
      interval: 4000,
    });
    setSplide(splide);
    splide.on("move", (e) => {
      setActive(e);
    });
    splide.mount();
  }, []);

  return (
    <section className={`${styles.splide} splide`}>
      <div className="splide__track">
        <ul className="splide__list">
          {bannerList.map((item, index) => {
            return (
              <li
                key={index}
                style={{
                  "--kv-pc": "url(" + item.pc_image + ")",
                  "--kv-ipad": "url(" + item.ipad_image + ")",
                  "--kv-mob": "url(" + item.mob_image + ")",
                }}
                className={`${styles.splide_item} splide__slide`}
              >
                {item.href.startsWith("http") ? (
                  <a rel="noreferrer" target="_blank" href={item.href}></a>
                ) : (
                  <a
                    onClick={() => {
                      router.push(item.href);
                    }}
                  ></a>
                )}
                <div className={styles.splide_content_container}>
                  <div
                    className={`
                  ${styles.splide_content}
                  ${!item.isDark ? styles.light : ""}
                `}
                  >
                    <div>
                      {item.sub_title ? <h3>{item.sub_title}</h3> : null}
                      {item.title ? <h2>{item.title}</h2> : null}
                      {item.description ? <p>{item.description}</p> : null}
                      <button>{LANG["store.index.buy_now"]}</button>
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
      {bannerList.length > 1 ? (
        <div className={styles.splide_progress}>
          <div className={styles.point_list}>
            {bannerList.map((_, index) => {
              return (
                <div
                  key={index}
                  onClick={() => {
                    splide.go(index);
                  }}
                  className={`${styles.point_item} ${
                    index === active ? styles.active : ""
                  }`}
                ></div>
              );
            })}
          </div>
        </div>
      ) : null}
    </section>
  );
}
