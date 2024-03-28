"use client";
import React from "react";
import styles from "./index.module.scss";
import ProductContext from "../../ProductContext";
import { debounce } from "@/utils";

export default function GoodNav() {
  const { lazyLoading, productInfo, LANG } = React.useContext(ProductContext);
  const navList = React.useMemo(() => {
    let navList = [];
    if (productInfo.mediaList?.length > 0) {
      navList.push({
        title: LANG["store.product.nav.overview"],
        href: "#product_overview",
      });
    }
    if (productInfo.associationsList?.length > 0) {
      navList.push({
        title: LANG["store.product.nav.specs"],
        href: "#product_specs",
      });
    }
    if (productInfo.packageList?.length > 0) {
      navList.push({
        title: LANG["store.product.nav.package"],
        href: "#product_package",
      });
    }
    navList.push({
      title: LANG["store.product.nav.faq"],
      href: "#product_faq",
    });
    if (productInfo.reviewsList?.length > 0) {
      navList.push({
        title: LANG["store.product.nav.reviews"],
        href: "#product_reviews",
      });
    }
    return navList;
  }, []);
  React.useEffect(() => {
    if (!lazyLoading) {
      $(`.${styles.nav_item}`).on("click", function () {
        const href = $(this).attr("data-href");
        const top = $(href).offset().top;
        window.scrollTo({
          top: top - 68,
          behavior: "smooth",
        });
      });
      const scrollFun = debounce(function () {
        const scrollTop = $(document).scrollTop();
        for (let i = 0; i < navList.length; i++) {
          const $item = $(`.${styles.nav_item}`).eq(i);
          const $nextItem = $(`.${styles.nav_item}`).eq(i + 1);

          const href = $item.attr("data-href");
          const nextHref = $nextItem.attr("data-href");

          const top = $(href).offset()?.top - 80;
          const nextTop = nextHref
            ? $(nextHref).offset()?.top - 80
            : $(document).height();

          if (scrollTop > top && scrollTop < nextTop) {
            if (!$item.hasClass(styles.active)) {
              $item.addClass(styles.active);
              const left = $item.offset().left;
              const $navList = $(`.${styles.nav_list}`);
              $navList.scrollLeft(left);
            }
          } else {
            $item.removeClass(styles.active);
          }
        }
      }, 50);
      scrollFun();
      $(window).on("scroll", scrollFun);
      return () => {
        $(window).off("scroll", scrollFun);
      };
    }
  }, [lazyLoading]);
  return (
    <div className={styles.container}>
      <div className={styles.nav_list}>
        {navList.map((item, index) => {
          return (
            <div
              key={index}
              title={item.title}
              data-href={item.href}
              className={styles.nav_item}
            >
              {item.title}
            </div>
          );
        })}
      </div>
    </div>
  );
}
