"use client";

import React from "react";
import "@splidejs/splide/css";
import Splide from "@splidejs/splide";

import ProductContext from "../../productContext";

export default function MobProductList({ products, title }) {
  const { lazyLoading } = React.useContext(ProductContext);
  const initSplide = React.useCallback(() => {
    const splide = new Splide(`.${styles["splide-mobile"]}`, {
      pagination: false,
      autoplay: true,
      type: "loop",
      arrows: false,
      rewind: true,
      fixedWidth: "303px",
      fixedHeight: "404px",
      interval: 4000,
      pauseOnHover: false,
      padding: {
        left: "calc(50% - 151.5px)",
        right: "calc(50% - 151.5px)",
      },
      gap: 12,
    }).mount();

    const $progressList = $(
      `.${styles["splide-mobile"]} .${styles.pagination_progress}`
    ).find("svg");
    splide.on("move", function (index) {
      $progressList.each(function (progressIndex) {
        if (index === progressIndex) {
          $(this).attr("class", styles.active);
        } else {
          $(this).removeAttr("class");
        }
      });
    });
  }, []);

  React.useEffect(() => {
    if (!lazyLoading) {
      initSplide();
    }
  }, [lazyLoading]);
  return (
    <section className={styles.associate_product}>
      <div className={styles.title}>{title}</div>
      <div className={`splide ${styles["splide-mobile"]}`}>
        <div className="splide__track">
          <ul className="splide__list">
            {products.map((item, index) => (
              <li className="splide__slide" key={index}>
                <a
                  href={`/product/${item.sort_key}/${item.key}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  <div className={styles.splide_item}>
                    <div className={styles.media_background}>
                      <div className={styles.media_container}>
                        <img alt={item.name} src={item.image_list[0].src} />
                        <div className={styles.content_container}>
                          <div className={styles.learn_more_container}>
                            <div className={styles["product-name"]}>
                              {item.name}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </a>
              </li>
            ))}
          </ul>
          {products.length > 1 ? (
            <ul className={styles.pagination_progress}>
              {products.map((_, index) => {
                return (
                  <svg
                    className={index === 0 ? styles.active : ""}
                    key={index}
                    version="1.1"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 36 36"
                    preserveAspectRatio="none"
                  >
                    <circle
                      cx="18"
                      cy="18"
                      r="15.915494309189533"
                      fill="inherit"
                      stroke="inherit"
                      strokeDashoffset="inherit"
                      strokeWidth="6"
                      strokeLinecap="round"
                      strokeDasharray="100 100"
                    ></circle>
                  </svg>
                );
              })}
            </ul>
          ) : null}
        </div>
      </div>
    </section>
  );
}
