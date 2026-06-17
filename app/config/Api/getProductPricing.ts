/** @format */

// ============================================================
// 远程数据 API · GET ${HOST}/config/getProductPricing
// app/config/Api 远程数据接口层：运行时从后端拉取数据。
// ============================================================

const HOST = process.env.NEXT_PUBLIC_HOST;

// 兜底 revalidate（秒）。实时性靠后台 on-demand revalidateTag。
const REVALIDATE_FALLBACK = 86400; // 24h

/**
 * 商品地区价格（传统 ISR）。
 * tag: product:pricing:{sortKey}:{productKey}:{area} + product:pricing:{sortKey}:{productKey}
 *      + product:{sortKey}:{productKey}（与后台 revalidate 对齐）
 */
export async function getProductPricing({
  sortKey,
  productKey,
  area,
  locale,
}: {
  sortKey: string;
  productKey: string;
  area: string;
  locale: string;
}): Promise<any | null> {
  if (!HOST) {
    console.error("getProductPricing: NEXT_PUBLIC_HOST 未配置");
    return null;
  }

  const url =
    `${HOST}/config/getProductPricing` +
    `?sortKey=${encodeURIComponent(sortKey)}` +
    `&productKey=${encodeURIComponent(productKey)}` +
    `&area=${encodeURIComponent(area)}` +
    `&language=${encodeURIComponent(locale)}`;

  try {
    const res = await fetch(url, {
      next: {
        tags: [
          `product:pricing:${sortKey}:${productKey}:${area}`,
          `product:pricing:${sortKey}:${productKey}`,
          `product:${sortKey}:${productKey}`,
        ],
        revalidate: REVALIDATE_FALLBACK,
      },
    });
    if (!res.ok) {
      if (res.status !== 404) {
        console.error(
          `getProductPricing HTTP ${res.status}: ${sortKey}/${productKey}/${area}`
        );
      }
      return null;
    }
    const json = await res.json().catch(() => null);
    if (json?.code !== 0) {
      return null;
    }
    return json.data ?? null;
  } catch (err: any) {
    console.error(`getProductPricing fetch 失败:`, err?.message);
    return null;
  }
}
