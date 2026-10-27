/** @format */
import { ssrFetch } from "@/config/Api/ssrFetch";
import { isFrameworkBailout } from "@/config/Api/bailout";

// ============================================================
// 远程数据 API · GET ${HOST}/config/getTagProducts
// 商品标签位数据：传一个标签 key（后台「商品标签」里建的，如 best-sellers）即拿到该标签下的商品卡。
//
// 后端已把筛选下推到 SQL（经 erp_goods_tag_relation 子查询），只回商品卡字段：
// 相比早先「拉全量 /config/getProduct（全语言全关联 >44KB）再在 JS 里筛 tagList」，
// 响应量级小一到两个数量级，且语言回退/分类停用过滤都在后端统一处理。
//
// 不含价格：与分类页/首页同口径——comboList 只给 (key, associate_country_key)，
// 价格由客户端按 area cookie 调 /api/products-offer 批量取齐（避免货币闪动）。
// 纯 SSG，构建期固化，靠「发布」重建。
// ============================================================

const HOST = process.env.NEXT_PUBLIC_HOST;

import type { SimpleProduct } from "./types";

interface TagProductsResult {
  tag: {
    key: string;
    name: string;
    description?: string;
    /** 后台给标签配的主图 / 场景图，可空串 */
    image?: string;
    scene_image?: string;
    /** 实际命中的语言：请求语言无该标签时后端回退 en */
    language?: string;
  };
  goodList: SimpleProduct[];
}

/**
 * 按标签 key 取商品。
 *
 * @param locale  语言码；该语言没有这个标签时后端整体回退 en。
 * @param tagKey  标签 key（后台创建标签时填的，如 best-sellers）。
 * @param limit   只要前 N 条（按 weight 降序）；不传 = 全部。首页位常传 10。
 * @returns tag + goodList；标签不存在 / 接口失败 → null（调用方据此 404 或隐藏模块）。
 *          标签存在但该标签下没有上架商品 → goodList 为空数组（不是 null）。
 */
export default async function getTagProducts({
  locale,
  tagKey,
  limit,
}: {
  locale: string;
  tagKey: string;
  limit?: number;
}): Promise<TagProductsResult | null> {
  if (!HOST) {
    console.error("getTagProducts: NEXT_PUBLIC_HOST 未配置");
    return null;
  }
  if (!tagKey) return null;

  const qs = new URLSearchParams({ tagKey, language: locale });
  if (limit && limit > 0) qs.set("limit", String(limit));

  let res;
  try {
    res = await ssrFetch(`${HOST}/config/getTagProducts?${qs.toString()}`, {
      cache: "force-cache",
    });
  } catch (err: any) {
    if (isFrameworkBailout(err)) throw err;
    console.error("getTagProducts fetch 失败:", err?.message);
    return null;
  }
  if (!res.ok) {
    console.error("getTagProducts 异常状态:", res.status);
    return null;
  }

  const json = await res.json().catch(() => null);
  // 标签不存在时后端回 data:null；接口自身失败回 code!=0。
  const data = json?.data;
  if (!data?.tag?.key) return null;

  return {
    tag: data.tag,
    goodList: Array.isArray(data.goodList) ? data.goodList : [],
  };
}

// 供 generateStaticParams / sitemap 用：聚合全部 (locale, tagKey)（去重）。
//
// 仍走 /config/getProduct：本接口按单个 tagKey 取数，不做「全站有哪些标签」的枚举；
// 枚举只在构建期跑一次（非每页），沿用现有数据源即可，无需新增后端接口。
export async function getAllTagPaths(): Promise<
  { locale: string; tagKey: string }[]
> {
  if (!HOST) return [];
  let res;
  try {
    res = await ssrFetch(`${HOST}/config/getProduct`, { cache: "force-cache" });
  } catch (err: any) {
    if (isFrameworkBailout(err)) throw err;
    return [];
  }
  if (!res.ok) return [];
  const json = await res.json().catch(() => null);
  const list = json?.data?.list || [];

  const seen = new Set<string>();
  const out: { locale: string; tagKey: string }[] = [];
  list.forEach((item: any) => {
    const locale = item.language;
    const sortInfo = item.goodSort?.[0];
    if (sortInfo && sortInfo.enabled === false) return;
    const tags = Array.isArray(item?.tagList) ? item.tagList : [];
    tags.forEach((t: any) => {
      if (!t?.key || !locale) return;
      const k = `${locale}:${t.key}`;
      if (seen.has(k)) return;
      seen.add(k);
      out.push({ locale, tagKey: t.key });
    });
  });
  return out;
}
