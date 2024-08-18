/** @format */

export const runtime = "nodejs";
export const fetchCache = "force-cache";

const fs = require("fs");
import path from "path";
import { parse } from "url";
import getLanguage from "@/config/LANGUAGE";
import { cookies } from "next/headers";

const languageList = getLanguage("list");
const localeCache = {};

function updateLocaleCache(lang) {
  if (!localeCache[lang]) {
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
  return localeCache[lang];
}

languageList.forEach((item) => {
  console.log("item: ", item);
  updateLocaleCache(item.value);
});

export async function GET(req) {
  // 解析 URL 和查询参数
  const newReq = new Request(req);
  const parsedUrl = parse(newReq.url, true);
  const query = parsedUrl.query;
  const language = query.language;
  const data = localeCache[language || "en"];
  return Response.json(data);
}
