/** @format */

import { cookies } from "next/headers";

import cnBlogLayout from "@@/public/config/blog/layout/cn.json";
import hkBlogLayout from "@@/public/config/blog/layout/hk.json";
import enBlogLayout from "@@/public/config/blog/layout/en.json";
import esBlogLayout from "@@/public/config/blog/layout/es.json";
import frBlogLayout from "@@/public/config/blog/layout/fr.json";
import jaBlogLayout from "@@/public/config/blog/layout/ja.json";
import koBlogLayout from "@@/public/config/blog/layout/ko.json";
import ruBlogLayout from "@@/public/config/blog/layout/ru.json";
import deBlogLayout from "@@/public/config/blog/layout/de.json";
import itBlogLayout from "@@/public/config/blog/layout/it.json";

const layoutData = {
  cn: cnBlogLayout,
  hk: hkBlogLayout,
  en: enBlogLayout,
  es: esBlogLayout,
  fr: frBlogLayout,
  ja: jaBlogLayout,
  ko: koBlogLayout,
  ru: ruBlogLayout,
  de: deBlogLayout,
  it: itBlogLayout,
};

const localeData = new Map();
function handleProductList({ productList, area }) {
  if (Array.isArray(productList) && productList.length > 0) {
    return productList.map(
      ({
        reviewsList,
        image_list,
        comboList,
        reviews_num,
        reviews_score,
        ...item
      }) => {
        let areaInfo = null;
        comboList.find(({ areaList }) => {
          areaList.find((area_item) => {
            if (area_item.country_code === area) {
              areaInfo = area_item;
            }
            return area_item.country_code === area;
          });
          return areaInfo?.stock;
        });
        item.areaInfo = areaInfo;
        return item;
      }
    );
  }
  return [];
}

async function getData({ locale, nameSpace }) {
  const area = cookies().get("area")?.value || "us";
  const cacheKey = `${locale}:${area}:${nameSpace}`;
  const cachedData = localeData.get(cacheKey);

  if (!cachedData) {
    console.log("Cache miss, fetching data...");
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
  } else {
    console.log("Cache hit, returning cached data...");
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
