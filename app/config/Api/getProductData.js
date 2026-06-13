/** @format */

// ============================================================
// 远程数据 API · GET ${HOST}/config/getProduct
// app/config/Api 远程数据接口层：运行时从后端拉取数据。
// ============================================================

// 商品列表数据层（运行时从后端拉取，不再读本地物化 JSON）。
//
// 复刻 script/fetch-product.js 的整形逻辑：按 locale 过滤全量商品列表，
// 构造 "sort" 分组结构。地区价(areaInfo)按 cookie area 选取 —— 列表页
// （首页等）本就读 cookie 属动态渲染，故此处保留 area 维度。
// 商品「详情」走 getProductDetail（已整页静态化），与此文件解耦。

import { cookies } from "next/headers";

const HOST = process.env.NEXT_PUBLIC_HOST;
const REVALIDATE = 86400; // 24h，配合后台 on-demand revalidateTag('product:list')

// 分类商品精简（复刻 fetch-product.js handleSimpleProductList）
function handleSimpleProductList(productList) {
  if (Array.isArray(productList) && productList.length > 0) {
    return productList.map(
      ({ reviewsList, image_list, reviews_num, reviews_score, ...item }) => {
        const totalScore = reviewsList?.reduce(
          (pre, cur) => pre + cur.score,
          0
        );
        item.reviewScore = totalScore / reviewsList?.length || reviews_score;
        item.reviewsNum = reviewsList?.length || reviews_num;
        item.image = image_list?.[0]?.src;
        return item;
      }
    );
  }
  return [];
}

// 构造 "sort" 分组（复刻 fetch-product.js handleProductData 的 sort 部分）
function buildSortMap(productList) {
  const sortMap = {};
  productList.forEach(({ goodSort, ...item }) => {
    const sortInfo = goodSort?.[0];
    if (!sortInfo?.enabled) return;
    const simpleProduct = {
      key: item.key,
      sort_key: item.sort_key,
      name: item.name,
      reviewsList: item.reviewsList,
      image_list: item.image_list,
      reviews_num: item.reviews_num,
      reviews_score: item.reviews_score,
      comboList: item.comboList
    };
    sortMap[item.sort_key] = {
      ...sortInfo,
      goodList: sortMap[item.sort_key]
        ? [
            ...sortMap[item.sort_key].goodList,
            ...handleSimpleProductList([simpleProduct])
          ]
        : handleSimpleProductList([simpleProduct])
    };
  });
  return sortMap;
}

// 拉取后端全量商品列表，按 locale 过滤（无配置回退英文）。
async function fetchProductListByLocale(locale) {
  if (!HOST) {
    console.error("getProductData: NEXT_PUBLIC_HOST 未配置");
    return [];
  }
  let res;
  try {
    res = await fetch(`${HOST}/config/getProduct`, {
      next: { tags: ["product:list"], revalidate: REVALIDATE }
    });
  } catch (err) {
    console.error("getProductData fetch 失败:", err?.message);
    return [];
  }
  if (!res.ok) {
    console.error("getProductData 异常状态:", res.status);
    return [];
  }
  const json = await res.json().catch(() => null);
  const list = json?.data?.list || [];
  const byLang = {};
  list.forEach((item) => {
    if (!byLang[item.language]) byLang[item.language] = [];
    byLang[item.language].push(item);
  });
  return byLang[locale] || byLang["en"] || [];
}

// 把 comboList 按地区解析成带 areaInfo 的套餐（复刻原 getData 的 sort 分支）
function resolveSortByArea(sortMap, area) {
  return Object.keys(sortMap)
    .map((key) => {
      const { goodList, ...sort } = sortMap[key];
      return {
        ...sort,
        goodList: (goodList || []).map(({ comboList, ...item }) => ({
          ...item,
          comboList: (comboList || []).map(({ areaList, ...combo }) => {
            let areaInfo = null;
            (areaList || []).forEach((areaItem) => {
              if (areaItem.country_code === area) areaInfo = areaItem;
            });
            return { areaInfo, ...combo };
          })
        }))
      };
    })
    .sort((a, b) => b.weight - a.weight);
}

// 构造 layout（footer 导航）：复刻 fetch-product.js handleProductData 的 layout 部分。
// 依赖 sortMap（仅含 enabled 分类）+ 原始 productList。
function buildLayout(sortMap, productList) {
  const sortList = Object.keys(sortMap).map((key) =>
    sortMap[key]
      ? {
          sub_title: sortMap[key].name,
          href: `/#${sortMap[key].key}`,
          img: sortMap[key].image_src
        }
      : {}
  );
  const productListLayout = productList
    .filter((item) => item.goodSort?.[0]?.enabled)
    .filter((_, index) => index < 8)
    .map((item) => ({
      sub_title: item.name,
      href: `/#${item.key}`,
      img: item.image_list?.[0]?.src
    }));
  return { sortList, productList: productListLayout };
}

const localeData = new Map();
async function getData({ locale, nameSpace }) {
  // const cookieStore = await cookies();
  // const area = cookieStore.get("area")?.value || "us";
  const area = "us";
  const cacheKey = `${locale}:${area}:${nameSpace}`;
  if (localeData.has(cacheKey)) return localeData.get(cacheKey);

  const productList = await fetchProductListByLocale(locale);
  let data = null;

  if (nameSpace === "sort") {
    const sortMap = buildSortMap(productList);
    data = resolveSortByArea(sortMap, area);
  } else if (nameSpace === "layout") {
    const sortMap = buildSortMap(productList);
    data = buildLayout(sortMap, productList);
  }

  localeData.set(cacheKey, data);
  return data;
}

export default async function getGoodList({
  locale,
  configList,
  productNameSpace
}) {
  if (!configList.includes("product")) return null;
  const promiseList = await Promise.all(
    productNameSpace.map((nameSpace) => getData({ locale, nameSpace }))
  );
  const resMap = {};
  productNameSpace.forEach((item, index) => {
    resMap[item] = promiseList[index];
  });
  return resMap;
}
