/** @format */

import NAVFUNC from "@/config/NAVFUNC";
import styles from "./page.module.scss";
import React from "react";
import getConfigData from "@/utils/getConfigData";
import HeaderTitle from "./components/HeaderTitle";
import NavItem from "./components/NavItem";
import Link from "next/link";
import { cookies } from "next/headers";

export const runtime = "edge";

async function getData({
  locale,
  area,
  configList,
  languageNameSpace,
  configNameSpace,
}) {
  const result = await getConfigData({
    locale,
    area,
    configList,
    languageNameSpace,
    configNameSpace,
  });
  result.GOODLIST = result.GOODLIST.map(({ name, path, image_list }) => {
    return {
      name,
      path,
      image_list,
    };
  });
  result.GOODSORTLIST = result.GOODSORTLIST.map(
    ({ name, key, image_src, goodList }) => {
      return {
        name,
        key,
        image_src,
        goodList,
      };
    }
  );

  return result;
}

export async function generateMetadata({ params: { locale } }) {
  const { LANG, CONFIG } = await getConfigData({
    locale,
    configList: ["config", "language"],
  });

  return {
    title: `${LANG["www.nav_page.title"]} - ${CONFIG["company.basic.company_name"]}`,
    description: LANG["www.nav_page.description"],
    keywords: LANG["www.nav_page.keywords"],
  };
}

export default async function Nav({ params: { type, locale } }) {
  const area = cookies().get("area")?.value || "us";
  const { LANG, CONFIG, GOODSORTLIST, GOODLIST } = await getData({
    locale,
    area,
    configList: ["config", "language", "good", "goodSort"],
    languageNameSpace: ["www.nav_page", "common.nav"],
    configNameSpace: [
      "company.basic.company_name",
      "company.sales_channels.index",
    ],
  });
  const navList = NAVFUNC({
    LANG,
    CONFIG,
    goodList: GOODLIST,
    goodSortList: GOODSORTLIST,
  });
  return (
    <div className={styles.container}>
      <HeaderTitle navList={navList} type={type} />
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
                        href={`/product/${item.key}/${item2.key}`}
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
        <NavItem navList={navList} type={type} />
      ) : null}
    </div>
  );
}
