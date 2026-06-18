/** @format */

// ============================================================
// 远程数据 API · GET ${HOST}/config/getProduct
// app/config/Api 远程数据接口层：运行时从后端拉取数据。
// ============================================================

// 产品分类页数据：按 locale + sortKey 从后端拉取该分类下的商品列表。
//
// SSG 阶段不返回价格：每个商品的 comboList 只保留 (key, associate_country_key) 元数据，
// 价格由客户端按 area cookie 调 /api/products-pricing 批量取齐（避免货币闪动）。
// JSON-LD 走 server 子组件 SSG 以默认 us 兜底。
//
// 数据源与 getProductData 共用 /config/getProduct + tag('product:list')，
// 后台改商品调用 revalidateTag('product:list') 即可让分类页下次访问重建。

const HOST = process.env.NEXT_PUBLIC_HOST;
const REVALIDATE_FALLBACK = 86400; // 24h，兜底；实时性靠 on-demand revalidateTag

import type { SimpleProduct, CategoryNav } from "./types";

interface CategoryProductsResult {
  category: {
    key: string;
    name: string;
    description?: string;
    image_src?: string;
    weight?: number;
  };
  goodList: SimpleProduct[];
}

// 解析商品标签：读后端 /config/getProduct 返回的真实标签字段（tagList）。
// tagList 元素为 { key, name, language, ... }，统一取 name 成字符串数组；
// 无标签时返回 []（该商品在筛选里不命中任何标签）。
function resolveTags(item: any): string[] {
  const real = item.tagList || item.tags || null;
  if (!Array.isArray(real)) return [];
  return real
    .map((t: any) => (typeof t === "string" ? t : t?.name || t?.title))
    .filter(Boolean);
}

// 商品卡片精简：算评分/评论数、取主图，
// comboList 只保留 (key, associate_country_key) 供客户端按 area 批量取价；
// 附带 tags（商品标签）供客户端筛选。
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
    image_scenes: item.image_scenes,
    image_list: image_list,
    reviewScore: totalScore / reviewsList?.length || reviews_score,
    reviewsNum: reviewsList?.length || reviews_num,
    reviews_score,
    reviews_num,
    weight: item.weight,
    comboList: Array.isArray(item.comboList)
      ? item.comboList.map((c: any) => ({
          key: c?.key,
          associate_country_key: c?.associate_country_key,
        }))
      : [],
    tags: resolveTags(item),
  };
}

/**
 * @returns {Promise<{ category: object, goodList: object[] } | null>}
 *   category: { key, name, description, image_src, weight }，sortKey 无对应分类时为 null
 *   找不到该分类（无商品 / 接口失败）时整体返回 null，页面据此走 notFound。
 */
export default async function getCategoryProducts({
  locale,
  sortKey,
}: {
  locale: string;
  sortKey: string;
}): Promise<CategoryProductsResult | null> {
  if (!HOST) {
    console.error("getCategoryProducts: NEXT_PUBLIC_HOST 未配置");
    return null;
  }

  let res;
  try {
    res = await fetch(`${HOST}/config/getProduct`, {
      next: { tags: ["product:list"], revalidate: REVALIDATE_FALLBACK },
    });
  } catch (err: any) {
    console.error("getCategoryProducts fetch 失败:", err?.message);
    return null;
  }
  if (!res.ok) {
    console.error("getCategoryProducts 异常状态:", res.status);
    return null;
  }

  const json = await res.json().catch(() => null);
  const list = json?.data?.list || [];

  // 按 locale 过滤（无该语言回退英文），再按 sortKey 收敛到当前分类。
  const byLang: Record<string, any[]> = {};
  list.forEach((item: any) => {
    (byLang[item.language] ||= []).push(item);
  });
  const localeList = byLang[locale] || byLang["en"] || [];

  let category: CategoryProductsResult["category"] | null = null;
  const goodList: SimpleProduct[] = [];
  localeList.forEach((item: any) => {
    if (item.sort_key !== sortKey) return;
    const sortInfo = item.goodSort?.[0];
    if (!sortInfo?.enabled) return; // 分类未启用 → 跳过
    if (!category) {
      category = {
        key: sortInfo.key,
        name: sortInfo.name,
        description: sortInfo.description,
        image_src: sortInfo.image_src,
        weight: sortInfo.weight,
      };
    }
    goodList.push(toSimpleProduct(item));
  });

  if (!category || goodList.length === 0) return null;

  goodList.sort((a, b) => (b.weight || 0) - (a.weight || 0));
  return { category, goodList };
}

// 供分类导航/面包屑用：返回全部启用分类（去重、按权重降序）。
export async function getAllCategories({
  locale,
}: {
  locale: string;
}): Promise<CategoryNav[]> {
  if (!HOST) return [];
  let res;
  try {
    res = await fetch(`${HOST}/config/getProduct`, {
      next: { tags: ["product:list"], revalidate: REVALIDATE_FALLBACK },
    });
  } catch {
    return [];
  }
  if (!res.ok) return [];
  const json = await res.json().catch(() => null);
  const list = json?.data?.list || [];
  const byLang: Record<string, any[]> = {};
  list.forEach((item: any) => {
    (byLang[item.language] ||= []).push(item);
  });
  const localeList = byLang[locale] || byLang["en"] || [];

  const map: Record<string, CategoryNav> = {};
  localeList.forEach((item: any) => {
    const s = item.goodSort?.[0];
    if (!s?.enabled || map[s.key]) return;
    map[s.key] = { key: s.key, name: s.name, weight: s.weight };
  });
  return Object.values(map).sort((a, b) => (b.weight || 0) - (a.weight || 0));
}
