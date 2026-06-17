/** @format */

// ============================================================
// 远程数据 API · GET ${HOST}/config/getBlogPaths
// app/config/Api 远程数据接口层：运行时从后端拉取数据。
// ============================================================

const HOST = process.env.NEXT_PUBLIC_HOST;

import type { BlogPathItem } from "./types";

/**
 * 构建期枚举所有 (locale, sortKey, blogKey)，供 generateStaticParams 预生成文章页。
 * 接口失败时返回空数组，避免开发环境网络抖动导致整页 500。
 */
export async function getBlogPaths(): Promise<BlogPathItem[]> {
  if (!HOST) {
    console.error("getBlogPaths: NEXT_PUBLIC_HOST 未配置");
    return [];
  }

  try {
    const res = await fetch(`${HOST}/config/getBlogPaths`);
    if (!res.ok) {
      console.error(`getBlogPaths 失败: HTTP ${res.status}`);
      return [];
    }

    const json = await res.json();
    return (json?.data?.list || []).map(
      ({ locale, sortKey, blogKey }: BlogPathItem) => ({
        locale,
        sortKey,
        blogKey,
      })
    );
  } catch (err: any) {
    console.error("getBlogPaths fetch 失败:", err?.message);
    return [];
  }
}

export default getBlogPaths;
