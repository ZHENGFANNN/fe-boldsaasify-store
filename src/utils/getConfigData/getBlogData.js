/** @format */

import "server-only";
export const runtime = "nodejs";
import getLanguage from "@/config/LANGUAGE";
const languageList = getLanguage("list");
const localeCache = {};
function updateLocaleCache(lang) {
  const fileContents = require(`@@/locale/blogData/${lang}.json`);
  try {
    const data = JSON.parse(fileContents);
    localeCache[lang] = data;
    return data;
  } catch {
    localeCache[lang] = fileContents;
    return fileContents;
  }
}

// const updateData = () => {
//   languageList.forEach((item) => {
//     updateLocaleCache(item.value);
//   });
// };

// // 初始化缓存
// updateData();

export default async function getBlogList(lang) {
  return updateLocaleCache(lang);
}
