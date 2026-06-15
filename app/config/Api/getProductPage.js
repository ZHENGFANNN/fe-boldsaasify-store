/** @format */

// ============================================================
// 远程数据 API · GET ${HOST}/config/getProductPage
// app/config/Api 远程数据接口层：运行时从后端拉取数据。
//
// 只负责拉商品本身（productInfo）。多语言/页面配置由各调用方
// 按命名空间独立走 getRemoteLanguage / getRemoteConfig，各接口互不耦合。
// ============================================================

const HOST = process.env.NEXT_PUBLIC_HOST;

// 兜底 revalidate（秒）。真正实时性靠后台 on-demand revalidateTag，
// 长周期只防 tag 漏触发时数据长期陈旧。
const REVALIDATE_FALLBACK = 86400; // 24h

/**
 * 商品详情数据（不含地区价格、不含多语言/配置）。
 * 传统 ISR：fetch 打 tag，由 /api/revalidate 按 tag 触发重建。
 */
export async function getProductPage({ locale, sortKey, productKey }) {
  if (!HOST) {
    console.error("getProductPage: NEXT_PUBLIC_HOST 未配置");
    return { productInfo: null };
  }

  const url =
    `${HOST}/config/getProductPage` +
    `?sortKey=${encodeURIComponent(sortKey)}` +
    `&productKey=${encodeURIComponent(productKey)}` +
    `&language=${encodeURIComponent(locale)}`;

  let productInfo = null;

  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(15000),
      next: {
        tags: [
          `product:page:${sortKey}:${productKey}`,
          `product:${sortKey}:${productKey}`,
        ],
        revalidate: REVALIDATE_FALLBACK,
      },
    });
    if (res.ok) {
      const json = await res.json().catch(() => null);
      productInfo = json?.data?.product ?? null;
      if (productInfo && !productInfo.key) {
        productInfo = null;
      }
    } else if (res.status === 404) {
      productInfo = null;
    } else {
      throw new Error(
        `getProductPage HTTP ${res.status}: ${sortKey}/${productKey}`
      );
    }
  } catch (err) {
    console.error(`getProductPage fetch 失败:`, err?.message);
    // 网络/超时错误不吞掉，避免 use cache 把 null 缓存成「永久 404」
    throw err;
  }

  return { productInfo };
}

export default getProductPage;
