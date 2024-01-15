import React from "react";

import ProductContext from "../../productContext";
import styles from "./index.module.scss";
import Link from "next/link";

export default function PcProductList({ products, title }) {
  const { lazyLoading } = React.useContext(ProductContext);
  const [active, setActive] = React.useState(0);
  const [showArrow, setShowArrow] = React.useState(true);

  const initList = React.useCallback(() => {
    const computedWidth = function () {
      const index = Math.ceil($(this).scrollLeft() / 412);
      setActive(index);

      // 计算滑倒最后的
      const translateX = $(`.${styles.item_content}`)
        .css("transform")
        ?.split(",")[4];
      // 计算出最后的（误差）
      if (
        Math.abs(
          $(this).scrollLeft() -
            412 * products.length +
            $(this).width() -
            translateX
        ) < 10
      ) {
        setActive(products.length);
      }
    };

    // 判断屏幕是否大于列表
    const translateX = $(`.${styles.item_content}`)
      .css("transform")
      ?.split(",")[4];
    if (412 * products.length <= $(window).width() - Number(translateX)) {
      setShowArrow(false);
    }

    $(`.${styles.list_container}`).on("scroll", computedWidth);
  }, []);

  const initAnimate = React.useCallback(() => {
    $(`.${styles.item_content}`).hover(
      function () {
        $(this).find(`.${styles.image_container_hover}`).addClass(styles.enter);
      },
      function () {
        $(this)
          .find(`.${styles.image_container_hover}`)
          .removeClass(styles.enter);
        $(this).find(`.${styles.image_container_hover}`).addClass(styles.leave);
        setTimeout(() => {
          $(this)
            .find(`.${styles.image_container_hover}`)
            .removeClass(styles.leave);
        }, 300);
      }
    );
  }, []);

  React.useEffect(() => {
    if (!lazyLoading) {
      initList();
      initAnimate();
    }
  }, [lazyLoading]);

  return (
    <section className={styles.associate_product}>
      <div className={styles.title}>{title}</div>
      <div className={styles.splide_container}>
        <ul className={styles.list_container}>
          {products.map((item, index) => (
            <li className={styles.list_item} key={index}>
              <Link
                className={styles.item_content}
                href={`/product/${item.sort_key}/${item.key}`}
                target="_blank"
              >
                <div className={styles.image_container}>
                  <img alt={item.name} src={item.image_list[0].src}></img>
                  {<div className={styles.product_name}>{item.name}</div>}
                </div>
                {item.image_scenes ? (
                  <div className={styles.image_container_hover}>
                    <img alt={item.name} src={item.image_scenes}></img>
                  </div>
                ) : null}
              </Link>
            </li>
          ))}
        </ul>
        <div
          className={`${styles.arrow_container} ${
            products.length < 4 || !showArrow ? styles.display_none : ""
          }`}
        >
          <button
            onClick={() => {
              if (active === 0) return;
              const $dom = $(`.${styles.list_container}`);
              const left = $dom.scrollLeft();
              $dom.scrollLeft(left - 412);
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
              if (active === products.length) return;
              const $dom = $(`.${styles.list_container}`);
              const left = $dom.scrollLeft();
              $dom.scrollLeft(left + 412);
            }}
            className={`${styles.next} ${
              active === products.length ? styles.opacity_0 : ""
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
    </section>
  );
}
