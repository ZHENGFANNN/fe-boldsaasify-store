/** @format */

// ============================================================
// 远程数据 API · GET ${HOST}/config/getProduct
// 首页产品列表数据层（运行时从后端拉取，按 locale 过滤 + sort 分类整形）。
//
// 与 getProductData.js 的区别：那个读 area cookie 在服务端预解析 areaInfo → 强制动态。
// 首页要整页 SSG，所以这里**不读 cookie、不解析 areaInfo**，每个商品保留完整
// comboList[].areaList，由客户端 IndexProductList 按 area cookie 解析（与分类页一致）。
//
// 数据源与 getCategoryProducts 共用 /config/getProduct + tag('product:list')，
// 后台改商品调用 revalidateTag('product:list') 即可让首页下次访问重建。
// ============================================================

const HOST = process.env.NEXT_PUBLIC_HOST;
const REVALIDATE = 86400; // 24h

// 商品卡片精简（复刻 getProductData.js handleSimpleProductList，但保留 comboList 全量地区价）。
import type { LocaleArg, SimpleProduct, ProductSort } from "./types";

function toSimpleProduct(item: any): SimpleProduct {
  const { reviewsList, reviews_num, reviews_score, image_list } = item;
  const totalScore = reviewsList?.reduce(
    (pre: number, cur: any) => pre + cur.score,
    0
  );
  return {
    key: item.key,
    sort_key: item.sort_key,
    name: item.name,
    description: item.description,
    image: image_list?.[0]?.src,
    image_list,
    image_scenes: item.image_scenes,
    reviewScore: totalScore / reviewsList?.length || reviews_score,
    reviewsNum: reviewsList?.length || reviews_num,
    reviews_score,
    reviews_num,
    weight: item.weight,
    // 保留完整 comboList（含 areaList），客户端按 area 选价。
    comboList: Array.isArray(item.comboList) ? item.comboList : [],
  };
}

// 首页：返回排序好的 goodSortList（仅 enabled 分类，按 weight 降序；每类含 goodList）。
export default async function getRemoteProductList({
  locale,
}: LocaleArg): Promise<ProductSort[]> {
  if (!HOST) {
    console.error("getRemoteProductList: NEXT_PUBLIC_HOST 未配置");
    return [];
  }
  let res;
  try {
    res = await fetch(`${HOST}/config/getProduct`, {
      next: {
        tags: ["product:list", `product:list:${locale}`],
        revalidate: REVALIDATE,
      },
    });
  } catch (err: any) {
    console.error("getRemoteProductList fetch 失败:", err?.message);
    return [];
  }
  if (!res.ok) {
    console.error("getRemoteProductList 异常状态:", res.status);
    return [];
  }

  const json = await res.json().catch(() => null);
  const list = json?.data?.list || [];
  const byLang: Record<string, any[]> = {};
  list.forEach((item: any) => {
    (byLang[item.language] ||= []).push(item);
  });
  const localeList = byLang[locale] || byLang["en"] || [];

  // 按 sort_key 聚合（仅 goodSort[0].enabled），构造分类 + goodList。
  const sortMap: Record<string, ProductSort> = {};
  localeList.forEach((item: any) => {
    const sortInfo = item.goodSort?.[0];
    if (!sortInfo?.enabled) return;
    const simple = toSimpleProduct(item);
    if (sortMap[item.sort_key]) {
      sortMap[item.sort_key].goodList.push(simple);
    } else {
      sortMap[item.sort_key] = {
        key: sortInfo.key,
        name: sortInfo.name,
        description: sortInfo.description,
        image_src: sortInfo.image_src,
        weight: sortInfo.weight,
        goodList: [simple],
      };
    }
  });

  return Object.values(sortMap).sort(
    (a, b) => (b.weight || 0) - (a.weight || 0)
  );
}
