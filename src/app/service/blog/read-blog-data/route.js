/** @format */

import fs from "fs";
import path from "path";
import getLanguage from "@/config/LANGUAGE";
export const runtime = "edge";
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
  } catch {
    localeCache[lang] = fileContents;
  }
}

export const updateData = () => {
  languageList.forEach((item) => {
    updateLocaleCache(item.value);
  });
};

// 初始化缓存
updateData();

export async function POST(request) {
  const { lang } = await request.json();
  return Response.json(localeCache[lang]);
}
