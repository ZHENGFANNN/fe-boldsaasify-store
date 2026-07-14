/** @format */

// ============================================================
// 远程数据 API · GET ${HOST}/config/getProduct
// LiveChat「分享商品」搜索目录：拉取后按 locale 压成精简列表缓存，
// 再做关键词 name 匹配。故意不用 Next fetch Data Cache（全量 JSON >2MB
// 会 set cache 失败，偶发喂到残缺旧条目，导致搜不到新品）。
// ============================================================

import { unstable_cache } from "next/cache";

const HOST = process.env.NEXT_PUBLIC_HOST;
const SLIM_REVALIDATE = 300; // 5 分钟；后台改商品仍可再靠 tag 失效

export interface CatalogProduct {
  key: string;
  sort_key: string;
  name: string;
  image: string;
}

type SlimProduct = CatalogProduct & { weight: number };

async function loadSlimCatalog(locale: string): Promise<SlimProduct[]> {
  if (!HOST) {
    console.error("getProductsCatalog: NEXT_PUBLIC_HOST 未配置");
    return [];
  }

  let res: Response;
  try {
    // no-store：绕过 Next 对超大响应的 Data Cache（>2MB 无法写入）
    res = await fetch(`${HOST}/config/getProduct`, { cache: "no-store" });
  } catch (err: any) {
    console.error("getProductsCatalog fetch 失败:", err?.message);
    return [];
  }
  if (!res.ok) {
    console.error("getProductsCatalog 异常状态:", res.status);
    return [];
  }

  const json = await res.json().catch(() => null);
  const list = json?.data?.list || [];
  const byLang: Record<string, any[]> = {};
  list.forEach((item: any) => {
    (byLang[item.language] ||= []).push(item);
  });
  const localeList = byLang[locale] || byLang["en"] || [];

  const slim: SlimProduct[] = [];
  for (const item of localeList) {
    const sortInfo = item.goodSort?.[0];
    if (!sortInfo?.enabled) continue;
    slim.push({
      key: item.key,
      sort_key: item.sort_key,
      name: String(item.name || ""),
      image: item.image_list?.[0]?.src || "",
      weight: Number(item.weight) || 0,
    });
  }
  return slim.sort((a, b) => b.weight - a.weight);
}

function getCachedSlimCatalog(locale: string): Promise<SlimProduct[]> {
  const cached = unstable_cache(
    () => loadSlimCatalog(locale),
    ["products-catalog-slim", locale],
    {
      revalidate: SLIM_REVALIDATE,
      tags: ["product:list", `product:list:${locale}`],
    }
  );
  return cached();
}

/**
 * @returns 匹配的精简商品列表（已按 weight 降序，最多 limit 条）
 */
export default async function getProductsCatalog({
  locale,
  q = "",
  limit = 30,
}: {
  locale: string;
  q?: string;
  limit?: number;
}): Promise<CatalogProduct[]> {
  const query = String(q || "").trim().toLowerCase();
  if (!query) return [];

  const slim = await getCachedSlimCatalog(locale || "en");
  return slim
    .filter((p) => p.name.toLowerCase().includes(query))
    .slice(0, limit)
    .map(({ key, sort_key, name, image }) => ({ key, sort_key, name, image }));
}
