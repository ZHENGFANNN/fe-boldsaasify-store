/** @format */

import { cookies } from "next/headers";

const globalConfig = require("@@/fetch-data/globalConfig/index.json");
const { toLocale } = require("@@/app/config/languageSettings");

const enabledLocales = (globalConfig["setting.language"] ?? [])
  .filter((item) => item.enabled !== false)
  .map((item) => toLocale(item.iso_code));

const layoutData = Object.fromEntries(
  enabledLocales.map((locale) => [
    locale,
    require(`@@/public/config/blog/layout/${locale}.json`),
  ])
);

const localeData = new Map();
function handleProductList({ productList, area }) {
  if (Array.isArray(productList) && productList.length > 0) {
    return productList.map(({ comboItem, ...item }) => {
      let areaInfo = null;
      comboItem.areaList.find((area_item) => {
        if (area_item.country_code === area) {
          areaInfo = area_item;
        }
        return area_item.country_code === area;
      });
      item.areaInfo = areaInfo;
      return item;
    });
  }
  return [];
}

async function getData({ locale, nameSpace }) {
  const cookieStore = await cookies();
  const area = cookieStore.get("area")?.value || "us";
  const cacheKey = `${locale}:${area}:${nameSpace}`;
  const cachedData = localeData.get(cacheKey);

  if (!cachedData) {
    // 性能优化：单独处理layout的数据（打包进去）
    if (nameSpace === "layout") {
      const data = layoutData[locale];
      localeData.set(cacheKey, data);
    } else {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_DOMAIN}/config/blog/${nameSpace}/${locale}.json`,
        { method: "GET" }
      );
      const data = await response.json();
      if (nameSpace.includes("article:")) {
        data.associateProduct = handleProductList({
          productList: data.associateProduct,
          area,
        });
      }
      localeData.set(cacheKey, data);
    }
  }
  return localeData.get(cacheKey);
}

export default async function getBlogList({
  locale,
  configList,
  blogNameSpace,
}) {
  if (!configList.includes("blog")) return null;
  const startTime = Date.now();
  const promiseList = await Promise.all(
    blogNameSpace.map((nameSpace) => getData({ locale, nameSpace }))
  );
  const resMap = {};
  blogNameSpace.forEach((item, index) => {
    resMap[item] = promiseList[index];
  });
  console.log(`---获取Blog时间: ${Date.now() - startTime}---`);
  return resMap;
}
