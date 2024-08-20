/** @format */

import { cookies } from "next/headers";
import { unstable_cache } from "next/cache";

/** @format */
const localeData = new Map();
async function getData({ lang, area }) {
  if (!localeData.get(`${lang}:${area}`)) {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_DOMAIN}/service/blog/read-blog-data?language=${lang}&area=${area}`,
      { method: "GET" }
    );
    const data = await response.json();
    localeData.set(`${lang}:${area}`, data);
  }
  return localeData.get(`${lang}:${area}`);
}

const getCachedData = function (lang, area) {
  return unstable_cache(
    async () => {
      const data = await getData({ lang, area });
      return data;
    },
    {
      key: `blog:${lang}:${area}`,
    }
)();
}


export default async function getBlogList(lang) {
  const startTime = Date.now();
  const area = cookies().get("area")?.value || "us";

  const data = await getCachedData(lang, area);
  console.log(`---获取Blog时间: ${Date.now() - startTime}---`);
  return data;
}
