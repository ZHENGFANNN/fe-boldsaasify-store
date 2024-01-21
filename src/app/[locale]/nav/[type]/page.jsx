import NAVFUNC from "@/config/NAVFUNC";
import styles from "./page.module.scss";
import React from "react";
import getAllConfigData from "@/utils/getAllConfigData";
import HeaderTitle from "./components/HeaderTitle";
import ProductInfo from "./components/ProductInfo";
import Link from "next/link";

export const runtime = "edge";

export async function generateMetadata({ params: { locale } }) {
  const { LANG, CONFIG } = await getAllConfigData(locale);
  return {
    title: `${CONFIG["company.basic.company_name"]} - ${LANG["www.nav_page.title"]}`,
    description: LANG["www.nav_page.description"],
    keywords: LANG["www.nav_page.keywords"],
  };
}

export default async function Nav({ params: { type, locale } }) {
  const { CONFIG, LANG, GOODSORTLIST, GOODLIST } = await getAllConfigData(
    locale
  );
  const NAVLIST = NAVFUNC({ LANG, CONFIG, GOODLIST, GOODSORTLIST });

  return (
    <div className={styles.container}>
      <HeaderTitle NAVLIST={NAVLIST} type={type} />
      {type === "product_info" ? (
        <section className={styles.header_nav_content}>
          {GOODSORTLIST.map((item, index) => {
            return (
              <div
                key={index}
                id={item.key}
                className={styles.header_nav_container}
              >
                <h2>{item.name}</h2>
                <div className={styles.header_nav_width}>
                  {item.goodList.map((item2, index2) => {
                    return (
                      <Link
                        key={index2}
                        href={`/store/product/${item.key}/${item2.key}`}
                        className={styles.header_nav_items}
                      >
                        <img
                          width={60}
                          height={60}
                          src={item2.image_list?.[0].src}
                          alt={item2.name}
                        />
                        <p>{item2.name}</p>
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </section>
      ) : null}
      {type !== "product_info" ? (
        <ProductInfo NAVLIST={NAVLIST} type={type} />
      ) : null}
    </div>
  );
}
