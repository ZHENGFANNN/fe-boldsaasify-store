/** @format */
import getLanguage from "@/config/LANGUAGE";
const languageList = getLanguage("list");

let localeCache = {};

async function updateLocaleCache(lang) {
  const dataModule = await import(`@@/locale/blogData/${lang}.json`);
  const data = dataModule.default;
  localeCache[lang] = data;
}

// 初始化缓存
languageList.forEach((item) => {
  updateLocaleCache(item.value);
});

export default async function getBlogList(lang) {
  console.log(`${process.env.NEXT_PUBLIC_DOMAIN}/service/refresh-data`);
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_DOMAIN}/service/refresh-data`
  );
  const data = await response.json();
  return data;
}

// const cn = require("@@/locale/blogData/cn.json");
// const de = require("@@/locale/blogData/dse.json");
// const en = require("@@/locale/blogData/en.json");
// const es = require("@@/locale/blogData/es.json");
// const fr = require("@@/locale/blogData/fr.json");
// const hk = require("@@/locale/blogData/hk.json");
// const it = require("@@/locale/blogData/it.json");
// const ja = require("@@/locale/blogData/ja.json");
// const ko = require("@@/locale/blogData/ko.json");
// const ru = require("@@/locale/blogData/ru.json");

// const blogData = {
//   cn,
//   de,
//   en,
//   es,
//   fr,
//   hk,
//   it,
//   ja,
//   ko,
//   ru,
// };

// export default async function getBlogList(lang) {
//   return blogData[lang];
// }
