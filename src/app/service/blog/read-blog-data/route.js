/** @format */

export const runtime = "nodejs";
export const fetchCache = "force-cache";

const fs = require("fs");
import path from "path";
import { parse } from "url";
import getLanguage from "@/config/LANGUAGE";

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
  updateLocaleCache(item.value);
});

function handleProductList({ productList, area }) {
  if (Array.isArray(productList) && productList.length > 0) {
    return productList.map(
      ({
        reviewsList,
        image_list,
        comboList,
        reviews_num,
        reviews_score,
        ...item
      }) => {
        let areaInfo = null;
        comboList.find(({ areaList }) => {
          areaList.find((area_item) => {
            if (area_item.country_code === "us" && !areaInfo) {
              areaInfo = area_item;
            }
            if (area_item.country_code === area) {
              areaInfo = area_item;
            }
            return area_item.country_code === area;
          });
          return areaInfo?.stock;
        });

        const totalScore = reviewsList?.reduce(
          (pre, cur) => pre + cur.score,
          0
        );
        item.reviewScore = totalScore / reviewsList?.length || reviews_score;
        item.reviewsNum = reviewsList?.length || reviews_num;

        item.image = image_list[0].src;
        item.areaInfo = areaInfo;

        return item;
      }
    );
  }
  return [];
}

export async function GET(req) {
  // 解析 URL 和查询参数
  const newReq = new Request(req);
  const parsedUrl = parse(newReq.url, true);
  const { language = "en", area = "us" } = parsedUrl.query;
  const data = JSON.parse(JSON.stringify(localeCache[language]));
  Object.keys(data.blogMap).map((key) => {
    const { associateProduct, ...item } = data.blogMap[key];
    data.blogMap[key] = {
      ...item,
      products: handleProductList({
        productList: associateProduct,
        area,
      }),
    };
  });
  return Response.json(data);
}
