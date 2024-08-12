/** @format */

export const runtime = "nodejs";
export const fetchCache = "force-cache";

const fs = require("fs");
const qs = require("qs");

import path from "path";
import getLanguage from "@/config/LANGUAGE";

const languageList = getLanguage("list");
const localeCache = {};

import Redis from "ioredis";
const client = new Redis(
  "rediss://default:AcuyAAIjcDEyYWY1YjhjMzY3OTg0OGIyYmJlYzk2NmZiZDc3OTM4OHAxMA@hot-llama-52146.upstash.io:6379"
);

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

export async function GET() {
  const startTime = new Date();
  console.time("---redis---");
  const foo = await client.get("foo");
  console.timeEnd("---redis---", Date.now() - startTime);
  const data = Response.json(localeCache);
  return data;
}
