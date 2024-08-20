/** @format */

export const runtime = "edge";
export const fetchCache = "force-cache";

// const fs = require("fs");
// import path from "path";
import { parse } from "url";
import getLanguage from "@/config/LANGUAGE";

const languageList = getLanguage("list");
const localeCache = {};

// function updateLocaleCache(lang) {
//   if (!localeCache[lang]) {
//     const filePath = path.join(
//       process.cwd(),
//       "locale",
//       "blogData",
//       `${lang}.json`
//     );
//     const fileContents = fs.readFileSync(filePath, "utf8");
//     try {
//       const data = JSON.parse(fileContents);
//       localeCache[lang] = data;
//     } catch {
//       localeCache[lang] = fileContents;
//     }
//   }
//   return localeCache[lang];
// }

function updateLocaleCache(lang) {
  switch (lang) {
    case "en":
      import("@@/locale/blogData/en.json").then((data) => {
        localeCache[lang] = data;
      });
      break;
    case "cn":
      import("@@/locale/blogData/cn.json").then((data) => {
        localeCache[lang] = data;
      });
      break;
    case "hk":
      import("@@/locale/blogData/hk.json").then((data) => {
        localeCache[lang] = data;
      });
      break;
    case "ja":
      import("@@/locale/blogData/ja.json").then((data) => {
        localeCache[lang] = data;
      });
      break;
    case "ko":
      import("@@/locale/blogData/ko.json").then((data) => {
        localeCache[lang] = data;
      });
      break;
    case "de":
      import("@@/locale/blogData/de.json").then((data) => {
        localeCache[lang] = data;
      });
      break;
    case "fr":
      import("@@/locale/blogData/fr.json").then((data) => {
        localeCache[lang] = data;
      });
      break;
    case "es":
      import("@@/locale/blogData/es.json").then((data) => {
        localeCache[lang] = data;
      });
      break;
    case "it":
      import("@@/locale/blogData/it.json").then((data) => {
        localeCache[lang] = data;
      });
      break;
    case "ru":
      import("@@/locale/blogData/ru.json").then((data) => {
        localeCache[lang] = data;
      });
      break;

    default:
      import("@@/locale/blogData/en.json").then((data) => {
        localeCache[lang] = data;
      });
  }
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
  const parsedUrl = parse(req.url, true); // 直接使用 req.url
  const { language, area } = parsedUrl.query;
  console.log("[GET language area]: ", language, area);
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
