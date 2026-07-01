/** @format */

// ============================================================
// 远程数据 API · GET ${HOST}/config/getArticlePaths
// app/config/Api 远程数据接口层：运行时从后端拉取数据。
// ============================================================

const HOST = process.env.NEXT_PUBLIC_HOST;

import type { ArticlePathItem } from "./types";

/**
 * 构建期枚举所有 (locale, sortKey, articleKey)，供 generateStaticParams 预生成文章页。
 * 接口失败时返回空数组，避免开发环境网络抖动导致整页 500（对齐 getBlogPaths）。
 */
export async function getArticlePaths(): Promise<ArticlePathItem[]> {
  if (!HOST) {
    console.error("getArticlePaths: NEXT_PUBLIC_HOST 未配置");
    return [];
  }

  try {
    const res = await fetch(`${HOST}/config/getArticlePaths`);
    if (!res.ok) {
      console.error(`getArticlePaths 失败: HTTP ${res.status}`);
      return [];
    }

    const json = await res.json();
    return (json?.data?.list || []).map(
      ({ locale, sortKey, articleKey }: ArticlePathItem) => ({
        locale,
        sortKey,
        articleKey,
      })
    );
  } catch (err: any) {
    console.error("getArticlePaths fetch 失败:", err?.message);
    return [];
  }
}

export default getArticlePaths;
