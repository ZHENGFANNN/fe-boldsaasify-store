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
 * 获取数据
 */
const cache = new Map();
async function getData({ locale, area }) {
  const cacheKey = `page:${locale}:${area}`;
  if (cache.has(cacheKey)) {
    return cache.get(cacheKey);
  }
  const result = await getConfigData({
    locale,
    area,
    configList: ["config", "language", "product", "goodDiscountFestival"],
    productNameSpace: ["sort"],
    languageNameSpace: [
      "store.index",
      "common.advantage",
      "store.index.title",
      "store.index.description",
      "store.index.keywords",
    ],
    configNameSpace: ["store.index.banner", "company.basic.company_name"],
  });

  result.PRODUCT.sort = result.PRODUCT.sort.map(({ goodList, ...item }) => {
    return {
      ...item,
      goodList: goodList.map(({ comboList, ...good }) => {
        return {
          areaInfo: comboList[0].areaInfo,
          ...good,
        };
      }),
    };
  });
  cache.set(cacheKey, result);
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
  const { CONFIG, LANG, GOODDISCOUNTFESTIVAL, PRODUCT } = await getData({
    locale,
    area,
  });

  return (
    <main>
      <IndexContext
        CONFIG={CONFIG}
        LANG={LANG}
        goodDiscountFestival={GOODDISCOUNTFESTIVAL}
        goodSortList={PRODUCT.sort}
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
