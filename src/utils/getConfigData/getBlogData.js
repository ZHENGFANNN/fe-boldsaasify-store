/** @format */

import { cookies } from "next/headers";

/** @format */
const localeData = {
  cn: {},
  en: {},
  ja: {},
  ko: {},
  de: {},
  it: {},
  ru: {},
  fr: {},
  hk: {},
};

async function getData({ lang, area }) {
  if (!localeData[lang][area]) {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_DOMAIN}/service/blog/read-blog-data?language=${lang}&area=${area}`,
      {
        method: "GET",
      }
    );
    const data = await response.json();
    localeData[lang][area] = data;
  }
  return localeData[lang][area];
}

export default async function getBlogList(lang) {
  const startTime = Date.now();
  const area = cookies().get("area")?.value || "us";
  const data = await getData({ lang, area });
  console.log(`---获取Blog时间: ${Date.now() - startTime}---`);
  console.log(`---【当前时间戳】: ${Date.now()}---`);
  return data;
}
