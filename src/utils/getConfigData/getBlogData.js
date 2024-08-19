/** @format */

import { cookies } from "next/headers";
import { unstable_cache } from "next/cache";

/** @format */
const localeData = new Map();
async function getData({ lang, area }) {
  if (!localeData.get(`${lang}:${lang}`)) {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_DOMAIN}/service/blog/read-blog-data?language=${lang}&area=${area}`,
      { method: "GET" }
    );
    const data = await response.json();
    localeData.set(`${lang}:${lang}`, data);
  }
  return localeData.get(`${lang}:${lang}`);
}

const getCachedData = unstable_cache(
  async ({ lang, area }) => getData({ lang, area }),
  [`${lang}:${area}`]
);

export default async function getBlogList(lang) {
  const startTime = Date.now();
  const area = cookies().get("area")?.value || "us";
  const data = await getCachedData({ lang, area });
  console.log(`---获取Blog时间: ${Date.now() - startTime}---`);
  return data;
}
