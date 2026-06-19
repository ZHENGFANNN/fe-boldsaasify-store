/** @format */

// ============================================================
// 远程数据 API · GET ${HOST}/config/getProductOptions
// V2 选项体系：拉某商品的选项轴(含值) + 变体映射，供商详页「Shopify 式」逐轴选值。
// 选项与地区无关，构建期静态拉取（与 getProductPage 一起），不读 cookie，保持 SSG。
// ============================================================

import type { ProductOptions } from "./types";

const HOST = process.env.NEXT_PUBLIC_HOST;
const REVALIDATE_FALLBACK = 86400; // 24h；实时性靠 on-demand revalidateTag('product:...')

const EMPTY: ProductOptions = { axes: [], variants: [] };

export async function getProductOptions({
  locale,
  sortKey,
  productKey,
}: {
  locale: string;
  sortKey: string;
  productKey: string;
}): Promise<ProductOptions> {
  if (!HOST) {
    console.error("getProductOptions: NEXT_PUBLIC_HOST 未配置");
    return EMPTY;
  }
  const url =
    `${HOST}/config/getProductOptions` +
    `?sortKey=${encodeURIComponent(sortKey)}` +
    `&productKey=${encodeURIComponent(productKey)}` +
    `&language=${encodeURIComponent(locale)}`;

  try {
    const res = await fetch(url, {
      next: {
        tags: [`product:options:${sortKey}:${productKey}`, `product:${sortKey}:${productKey}`],
        revalidate: REVALIDATE_FALLBACK,
      },
    });
    if (!res.ok) {
      if (res.status !== 404) {
        console.error(`getProductOptions HTTP ${res.status}: ${sortKey}/${productKey}`);
      }
      return EMPTY;
    }
    const json = await res.json().catch(() => null);
    const data = json?.data || {};
    return {
      axes: Array.isArray(data.axes) ? data.axes : [],
      variants: Array.isArray(data.variants) ? data.variants : [],
    };
  } catch (err: any) {
    console.error("getProductOptions fetch 失败:", err?.message);
    return EMPTY;
  }
}

export default getProductOptions;
