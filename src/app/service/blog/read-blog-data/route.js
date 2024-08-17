/** @format */

// export const runtime = "edge";
// export const fetchCache = "force-cache";

// const fs = require("fs");
// const qs = require("qs");

// import path from "path";
// import getLanguage from "@/config/LANGUAGE";

// const languageList = getLanguage("list");
// const localeCache = {};

// function updateLocaleCache(lang) {
//   const filePath = path.join(
//     process.cwd(),
//     "locale",
//     "blogData",
//     `${lang}.json`
//   );
//   const fileContents = fs.readFileSync(filePath, "utf8");
//   try {
//     const data = JSON.parse(fileContents);
//     localeCache[lang] = data;
//   } catch {
//     localeCache[lang] = fileContents;
//   }
// }

// export const updateData = () => {
//   languageList.forEach((item) => {
//     updateLocaleCache(item.value);
//   });
// };

// // 初始化缓存
// updateData();

// export async function GET(req) {
//   const { language } = qs.parse(req.url.split("?")[1]);
//   console.log("[locale]: ", language);
//   const data = Response.json(localeCache);
//   return data;
// }

export const runtime = "edge"; // 修改为 'edge'
export const fetchCache = "force-cache";

import getLanguage from "@/config/LANGUAGE";

const languageList = getLanguage("list");

const localeCache = {};
async function loadLocaleData(language) {
  if (!localeCache[language]) {
    try {
      // 动态导入本地化数据文件
      const data = await import(
        /* webpackChunkName: "locale-[request]" */ `@@/locale/blogData/${language}.json`
      );
      localeCache[language] = data.default;
    } catch (error) {
      console.error(`Error loading data for language ${language}:`, error);
      localeCache[language] = {}; // 如果加载数据失败，设置为空对象
    }
  }
  return localeCache[language];
}

export async function GET(req) {
  const url = new URL(req.url);
  const language = url.searchParams.get("language"); // 默认语言为 'en'
  const data = await loadLocaleData(language);
  return Response.json(data);
}
