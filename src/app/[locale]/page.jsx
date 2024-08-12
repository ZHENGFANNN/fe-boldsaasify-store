/** @format */

import React from "react";

import Advantage from "@/components/Layout/Advantage";
import getConfigData from "@/utils/getConfigData";

import IndexProductList from "./components/IndexProductList";
import IndexBanner from "./components/IndexBanner";
import IndexContext from "./components/IndexContext";

import { cookies } from "next/headers";

export const runtime = "edge";

/**
 * 处理分类列表
 */
async function getSortList(productSort) {
  return productSort.map(({ name, goodList, key }) => {
    goodList = goodList.map(
      ({
        name,
        key,
        sort_key,
        image_list,
        image_scenes,
        reviews_num,
        reviews_score,
        reviewsList,
        comboList,
      }) => {
        const totalValue = reviewsList.reduce((pre, cur) => pre + cur.score, 0);
        const avertValue = totalValue / reviewsList.length;
        const { areaInfo } =
          comboList.find((item) => {
            return item.areaInfo?.stock;
          }) ||
          comboList[0] ||
          {};
        return {
          name,
          key,
          sort_key,
          image_url: image_list[0].src,
          image_scenes,
          areaInfo,
          reviews_num: reviewsList.length || reviews_num,
          reviews_score: avertValue || reviews_score,
        };
      }
    );
    return {
      name,
      key,
      goodList,
    };
  });
}

/**
 * 获取数据
 */
async function getData({ locale, area }) {
  const result = await getConfigData({
    locale,
    area,
    configList: ["config", "language", "goodSort", "goodDiscountFestival"],
    languageNameSpace: [
      "store.index",
      "common.advantage",
      "store.index.title",
      "store.index.description",
      "store.index.keywords",
    ],
    configNameSpace: ["store.index.banner", "company.basic.company_name"],
  });
  result.GOODSORTLIST = await getSortList(result.GOODSORTLIST);
  return result;
}

export async function generateMetadata({ params: { locale } }) {
  const area = cookies().get("area")?.value || "us";
  const { LANG, CONFIG } = await getData({
    locale,
    area,
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
  });

  return (
    <main>
      <IndexContext
        CONFIG={CONFIG}
        LANG={LANG}
        goodDiscountFestival={GOODDISCOUNTFESTIVAL}
        goodSortList={GOODSORTLIST}
        locale={locale}
        area={area}
      >
        {/* Banner */}
        <IndexBanner />
        {/* List */}
        <IndexProductList />
        <Advantage LANG={LANG} />
      </IndexContext>
    </main>
  );
}
