/** @format */

import "server-only";
export const runtime = "nodejs";

const fs = require("fs");
import path from "path";
import getLanguage from "@/config/LANGUAGE";
const languageList = getLanguage("list");
const localeCache = {};

function updateLocaleCache(lang) {
  const filePath = path.join(
    process.cwd(),
    "locale",
    "blogData",
    `${lang}.json`
  );
  const fileContents = fs.readFileSync(filePath, "utf8");
  try {
    const data = JSON.parse(fileContents);
    localeCache[lang] = data;
    return data;
  } catch {
    localeCache[lang] = fileContents;
    return data;
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
