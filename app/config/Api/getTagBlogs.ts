/** @format */
import { ssrFetch } from "@/config/Api/ssrFetch";
import { isFrameworkBailout } from "@/config/Api/bailout";

// ============================================================
// 远程数据 API · GET ${HOST}/config/getTagBlogs
// 博客标签位数据：传一个标签 key（后台「博客标签」里建的，如 index-blog）即拿到该标签下的文章卡。
//
// 后端已把筛选下推到 SQL（经 erp_blog_tag_relation 子查询）且显式排除 content 正文：
// 相比「拉全量 /config/getBlog（全语言 + 正文 + 全关联）再在 JS 里拍平筛选」，
// 响应量级小一到两个数量级，且语言回退/分类停用过滤都在后端统一处理。
//
// 与 getTagProducts 的差异：博客标签字典表没有 image/scene_image 列
// （博客标签不做 /blog/tag/<key> 落地页），故 tag 元信息少这两个字段。
// 纯 SSG，构建期固化，靠「发布」重建。
// ============================================================

const HOST = process.env.NEXT_PUBLIC_HOST;

import type { BlogArticleCard } from "./types";

/** 标签位文章卡：BlogArticleCard 之外后端还带了分类展示名（卡片眉标）与权重 */
export interface TagBlogCard extends BlogArticleCard {
  /** 所属分类展示名，供卡片眉标（如 Diamond Education） */
  sort_name?: string;
  weight?: number;
  created_time?: string;
}

interface TagBlogsResult {
  tag: {
    key: string;
    name: string;
    description?: string;
    /** 实际命中的语言：请求语言无该标签时后端回退 en */
    language?: string;
  };
  blogList: TagBlogCard[];
}

/**
 * 按标签 key 取博客文章。
 *
 * @param locale  语言码；该语言没有这个标签时后端整体回退 en。
 * @param tagKey  标签 key（后台「博客标签」创建时填的，如 index-blog）。
 * @param limit   只要前 N 条（weight 降序、同权重按更新时间新的在前）；不传 = 全部。首页位常传 3。
 * @returns tag + blogList；标签不存在 / 接口失败 → null（调用方据此隐藏模块或回退其它数据源）。
 *          标签存在但该标签下没有上架文章 → blogList 为空数组（不是 null）。
 */
export default async function getTagBlogs({
  locale,
  tagKey,
  limit,
}: {
  locale: string;
  tagKey: string;
  limit?: number;
}): Promise<TagBlogsResult | null> {
  if (!HOST) {
    console.error("getTagBlogs: NEXT_PUBLIC_HOST 未配置");
    return null;
  }
  if (!tagKey) return null;

  const qs = new URLSearchParams({ tagKey, language: locale });
  if (limit && limit > 0) qs.set("limit", String(limit));

  let res;
  try {
    res = await ssrFetch(`${HOST}/config/getTagBlogs?${qs.toString()}`, {
      cache: "force-cache",
    });
  } catch (err: any) {
    if (isFrameworkBailout(err)) throw err;
    console.error("getTagBlogs fetch 失败:", err?.message);
    return null;
  }
  if (!res.ok) {
    console.error("getTagBlogs 异常状态:", res.status);
    return null;
  }

  const json = await res.json().catch(() => null);
  // 标签不存在时后端回 data:null；接口自身失败回 code!=0。
  const data = json?.data;
  if (!data?.tag?.key) return null;

  return {
    tag: data.tag,
    blogList: Array.isArray(data.blogList) ? data.blogList : [],
  };
}
