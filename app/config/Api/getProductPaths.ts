/** @format */

// ============================================================
// 远程数据 API · GET ${HOST}/config/getProductPaths
// app/config/Api 远程数据接口层：运行时从后端拉取数据。
// ============================================================

const HOST = process.env.NEXT_PUBLIC_HOST;

import type { ProductPathItem } from "./types";

/**
 * 构建期枚举所有 (locale, sortKey, productKey)，供 generateStaticParams 预生成商品页。
 * 接口失败时返回空数组，避免开发环境网络抖动导致整页 500。
 */
export async function getProductPaths(): Promise<ProductPathItem[]> {
  if (!HOST) {
    console.error("getProductPaths: NEXT_PUBLIC_HOST 未配置");
    return [];
  }

  try {
    const res = await fetch(`${HOST}/config/getProductPaths`);
    if (!res.ok) {
      console.error(`getProductPaths 失败: HTTP ${res.status}`);
      return [];
    }

    const json = await res.json();
    return (json?.data?.list || []).map(
      ({ locale, sortKey, productKey }: ProductPathItem) => ({
        locale,
        sortKey,
        productKey,
      })
    );
  } catch (err: any) {
    console.error("getProductPaths fetch 失败:", err?.message);
    return [];
  }
}

export default getProductPaths;
