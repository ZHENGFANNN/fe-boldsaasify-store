/** @format */

// ============================================================
// 远程数据 API · GET ${HOST}/config/getBlog
// 博客列表/分类数据层（运行时从后端拉取，按 locale 过滤 + 整形）。
//
// 复刻 getBlogData.js 的 sort 分类整形，但拆成页面直用的两个语义：
//   - getBlogList({locale})         → 首页：排序好的 blogSortList（含每类 blogList）
//   - getBlogCategory({locale,sortKey}) → 分类页/文章页：
//        { category, blogList, categories }（category 命中的当前分类，
//        categories 为轻量导航列表 [{key,name,weight}]）
//
// 数据源与 getBlogDetail/getRemoteBlogBanner 共用 /config/getBlog + tag('blog:list')，
// 后台改文章调用 revalidateTag('blog:list') 即可让列表/分类页下次访问重建。
// ============================================================

const HOST = process.env.NEXT_PUBLIC_HOST;
const REVALIDATE = 86400; // 24h，兜底；实时性靠 on-demand revalidateTag

import type { BlogSort, BlogCategoryResult } from "./types";

// 拉取后端全量文章列表，按 locale 过滤（无配置回退英文）。
async function fetchBlogListByLocale(locale: string): Promise<any[]> {
  if (!HOST) {
    console.error("getRemoteBlogList: NEXT_PUBLIC_HOST 未配置");
    return [];
  }
  let res;
  try {
    res = await fetch(`${HOST}/config/getBlog`, {
      next: { tags: ["blog:list", `blog:list:${locale}`], revalidate: REVALIDATE },
    });
  } catch (err: any) {
    console.error("getRemoteBlogList fetch 失败:", err?.message);
    return [];
  }
  if (!res.ok) {
    console.error("getRemoteBlogList 异常状态:", res.status);
    return [];
  }
  const json = await res.json().catch(() => null);
  const list = json?.data?.list || [];
  const byLang: Record<string, any[]> = {};
  list.forEach((item: any) => {
    (byLang[item.language] ||= []).push(item);
  });
  return byLang[locale] || byLang["en"] || [];
}

// 构造 sort 分类映射（复刻 getBlogData.js buildBlogData 的 sort 部分）。
function buildSortMap(list: any[]): Record<string, BlogSort> {
  const sort: Record<string, BlogSort> = {};
  list.forEach(({ sortInfo, ...item }: any) => {
    const blogSortInfo = sortInfo?.[0];
    if (!blogSortInfo) return;
    const article = {
      image: item.image,
      title: item.title,
      key: item.key,
      sort_key: item.sort_key,
      updated_time: item.updated_time,
    };
    sort[item.sort_key] = {
      weight: blogSortInfo.weight,
      key: blogSortInfo.key,
      name: blogSortInfo.name,
      blogList: sort[item.sort_key]
        ? [...sort[item.sort_key].blogList, article]
        : [article],
    };
  });
  return sort;
}

// 由 sort map 派生排序好的分类数组（按 weight 降序）。
function toSortedList(sortMap: Record<string, BlogSort>): BlogSort[] {
  return Object.keys(sortMap)
    .map((key) => sortMap[key])
    .sort((a, b) => b.weight - a.weight);
}

// 首页：返回排序好的 blogSortList（含每类 blogList）。
export async function getBlogList({
  locale,
}: {
  locale: string;
}): Promise<BlogSort[]> {
  const list = await fetchBlogListByLocale(locale);
  return toSortedList(buildSortMap(list));
}

// 分类页/文章页：返回当前分类 + 该类文章 + 轻量导航列表。
// 未命中分类时 category 为 null（页面据此 notFound）。
export async function getBlogCategory({
  locale,
  sortKey,
}: {
  locale: string;
  sortKey: string;
}): Promise<BlogCategoryResult> {
  const list = await fetchBlogListByLocale(locale);
  const sortMap = buildSortMap(list);
  const sortedList = toSortedList(sortMap);

  // 轻量导航：仅 {key,name,weight}
  const categories = sortedList.map(({ key, name, weight }) => ({
    key,
    name,
    weight,
  }));

  const current = sortMap[sortKey] || null;
  return {
    category: current
      ? { key: current.key, name: current.name, weight: current.weight }
      : null,
    blogList: current?.blogList || [],
    categories,
  };
}
