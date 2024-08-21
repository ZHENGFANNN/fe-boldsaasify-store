/** @format */

import { cookies } from "next/headers";

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

        const totalScore = reviewsList?.reduce(
          (pre, cur) => pre + cur.score,
          0
        );
        item.reviewScore = totalScore / reviewsList?.length || reviews_score;
        item.reviewsNum = reviewsList?.length || reviews_num;

        item.image = image_list[0].src;
        item.areaInfo = areaInfo;

        return item;
      }
    );
  }
  return [];
}

async function getData({ lang, area }) {
  const cacheKey = `${lang}:${area}`;
  const cachedData = localeData.get(cacheKey);
  if (!cachedData) {
    console.log("Cache miss, fetching data...");
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_DOMAIN}/config/blog-data/${lang}.json`,
      {
        method: "GET",
        cache: "force-cache",
      }
    );
    const data = await response.json();
    Object.keys(data.blogMap).map((key) => {
      const { associateProduct, ...item } = data.blogMap[key];
      data.blogMap[key] = {
        ...item,
        products: handleProductList({
          productList: associateProduct,
          area,
        }),
      };
    });
    localeData.set(cacheKey, data);
  } else {
    console.log("Cache hit, returning cached data...");
  }
  return localeData.get(cacheKey);
}

export default async function getBlogList(lang) {
  const startTime = Date.now();
  const area = cookies().get("area")?.value || "us";
  const data = await getData({ lang, area });
  console.log(`---获取Blog时间: ${Date.now() - startTime}---`);
  return data;
}
