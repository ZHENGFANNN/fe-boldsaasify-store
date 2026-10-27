/** @format */
import { ssrFetch } from "@/config/Api/ssrFetch";
import type { LocaleArg, CategoryItem } from "./types";

// ============================================================
// 远程数据 API · GET ${HOST}/config/getSortList
// 首页「Shop by Category」分类导航数据层。
//
// 直接读 erp_goods_sort 全量分类（enabled=1，按 weight 降序），不依赖商品是否已上架，
// 也不在前端写死——空店同样能展示已配置分类及其 image_src。
// 通用接口 /config/getSortList 支持 language/enabled/key 筛选；首页只要启用分类，故传 enabled=1。
// 后端全语言聚合返回，这里按 locale 过滤，取不到回退 en（与 getRemoteProductList 一致）。
// 纯 SSG，构建期固化，靠「发布」重建。
// ============================================================

const HOST = process.env.NEXT_PUBLIC_HOST;

export default async function getSortList({
  locale,
}: LocaleArg): Promise<CategoryItem[]> {
  if (!HOST) {
    console.error("getSortList: NEXT_PUBLIC_HOST 未配置");
    return [];
  }
  let res;
  try {
    res = await ssrFetch(`${HOST}/config/getSortList?enabled=1`, {
      cache: "force-cache",
    });
  } catch (err: any) {
    console.error("getSortList fetch 失败:", err?.message);
    return [];
  }
  if (!res.ok) {
    console.error("getSortList 异常状态:", res.status);
    return [];
  }

  const json = await res.json().catch(() => null);
  const list: any[] = json?.data?.list || [];

  // 按语言分组，取当前 locale，缺则回退 en。
  const byLang: Record<string, CategoryItem[]> = {};
  list.forEach((item: any) => {
    (byLang[item.language] ||= []).push({
      key: item.key,
      name: item.name,
      description: item.description,
      image_src: item.image_src,
      image_scenes: item.image_scenes,
      weight: item.weight,
      language: item.language,
    });
  });
  const localeList = byLang[locale] || byLang["en"] || [];

  return localeList.sort((a, b) => (b.weight || 0) - (a.weight || 0));
}
