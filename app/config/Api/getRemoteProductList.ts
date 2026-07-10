/** @format */

// ============================================================
// 远程数据 API · GET ${HOST}/config/getProduct
// 首页产品列表数据层（运行时从后端拉取，按 locale 过滤 + sort 分类整形）。
//
// SSG 阶段不返回价格：每个商品的 comboList 只保留 (key, associate_country_key) 元数据，
// 价格与折扣由客户端按 area cookie 调 /api/products-offer 批量取齐（避免 us→cn 货币闪动）。
// JSON-LD（爬虫不执行 JS）走单独的 server 子组件 SSG 阶段以默认 us 取价兜底。
//
// 数据源与 getCategoryProducts 共用 /config/getProduct + tag('product:list')，
// 后台改商品调用 revalidateTag('product:list') 即可让首页下次访问重建。
// ============================================================

const HOST = process.env.NEXT_PUBLIC_HOST;
const REVALIDATE = 86400; // 24h

// 商品卡片精简（复刻 getProductData.js handleSimpleProductList，
// comboList 只保留客户端取价需要的 key + associate_country_key 元数据）。
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
    // 仅保留 combo 标识与 area 关联键，价格客户端按 area 批量取（不再写入 areaList，缩 SSG 体积）。
    comboList: Array.isArray(item.comboList)
      ? item.comboList.map((c: any) => ({
          key: c?.key,
          associate_country_key: c?.associate_country_key,
        }))
      : [],
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
