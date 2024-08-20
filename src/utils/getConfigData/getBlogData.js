/** @format */

import { cookies } from "next/headers";
import CacheHandler from "@@/cache-handler.js";

const localeData = new CacheHandler();

async function getData({ lang, area }) {
  const cacheKey = `${lang}:${area}`;
  const cachedData = await localeData.get(cacheKey);

  if (!cachedData) {
    console.log("Cache miss, fetching data...");
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_DOMAIN}/service/blog/read-blog-data?language=${lang}&area=${area}`,
      { method: "GET" }
    );
    const data = await response.json();
    await localeData.set(cacheKey, data);
  } else {
    console.log("Cache hit, returning cached data...");
  }

  return await localeData.get(cacheKey);
}

export default async function getBlogList(lang) {
  const startTime = Date.now();
  const area = cookies().get("area")?.value || "us";
  const data = await getData({ lang, area });
  console.log(`---获取Blog时间: ${Date.now() - startTime}---`);
  return data;
}
