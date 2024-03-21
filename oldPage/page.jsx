import styles from "./page.module.scss";
import React from "react";

import Advantage from "@/components/Layout/Advantage";
import getConfigDataV2 from "@/utils/getConfigDataV2";

import ProductList from "./components/ProductList";
import Banner from "./components/Banner";
import { cookies } from "next/headers";

export const runtime = "edge";

/**
 * 处理分类列表
 */
async function getSortList(productSort) {
  return productSort.map((item) => {
    const goodList = item.goodList.map((good) => {
      const totalValue = good.reviewsList.reduce(
        (pre, cur) => pre + cur.score,
        0
      );
      // 获取评论两种方式 评论配置 或 直接配置数量
      const avertValue =
        totalValue / good.reviewsList.length || good.reviews_score;
      const areaInfo = good.comboList[0]?.areaInfo;
      return {
        ...good,
        reviewScore: avertValue,
        areaInfo,
      };
    });
    return {
      ...item,
      goodList,
    };
  });
}

/**
 * 获取数据
 */
async function getData({ locale, area, configList }) {
  const result = await getConfigDataV2({ locale, area, configList });
  result.GOODSORTLIST = await getSortList(result.GOODSORTLIST);
  return result;
}

export async function generateMetadata({ params: { locale } }) {
  const { LANG, CONFIG } = await getConfigDataV2({
    locale,
    configList: ["language", "config"],
  });
  return {
    title: `${CONFIG["company.basic.company_name"]} - ${LANG["store.index.title"]}`,
    description: LANG["store.index.description"],
    keywords: LANG["store.index.keywords"],
  };
}

export default async function Home({ params: { locale } }) {
  const area = cookies().get("area")?.value || "us";
  const { CONFIG, LANG, GOODDISCOUNTFESTIVAL, GOODSORTLIST } = await getData({
    locale,
    area,
    configList: ["config", "language", "goodSort", "goodDiscountFestival"],
  });
  return (
    <main className={styles.container}>
      <Banner CONFIG={CONFIG} LANG={LANG} />
      {/* 产品列表 */}
      {GOODSORTLIST.map((item, index) => {
        return (
          <div className={styles.sort_container} key={index}>
            <div className={styles.sort_header}>
              <h2>{item.name}</h2>
            </div>
            <ProductList
              key={index}
              CONFIG={CONFIG}
              LANG={LANG}
              goodList={item.goodList}
              goodDiscountFestival={GOODDISCOUNTFESTIVAL}
            />
          </div>
        );
      })}
      <Advantage LANG={LANG} />
    </main>
  );
}
