/** @format */

// ============================================================
// 远程数据 API · GET ${HOST}/config/getProductPage
// app/config/Api 远程数据接口层：运行时从后端拉取数据。
//
// 只负责拉商品本身（productInfo）。多语言/页面配置由各调用方
// 按命名空间独立走 getRemoteLanguage / getRemoteConfig，各接口互不耦合。
// ============================================================

const HOST = process.env.NEXT_PUBLIC_HOST;

// 兜底 revalidate（秒）。真正实时性靠后台 on-demand revalidateTag；
// 兜底周期收紧到 5min：当 tag 漏触发（如直接改库设 three_d、或 git push 构建复用了
// 旧 fetch 缓存）时，商详页（含 3D）最多 5 分钟自愈，而非陈旧 24h。
const REVALIDATE_FALLBACK = 300; // 5min

/**
 * 商品详情数据（不含地区价格、不含多语言/配置）。
 * 传统 ISR：fetch 打 tag，由 /api/revalidate 按 tag 触发重建。
 *
 * customizeFields：商品定制字段配置（仅 enabled，后端按 weight 升序），
 * 与 product 平级返回；定制字段下沉 user-service 后随详情一并下发，
 * 前端不再单独调用 order-service /pay/getCustomizeFields。
 */
export async function getProductPage({
  locale,
  sortKey,
  productKey,
}: {
  locale: string;
  sortKey: string;
  productKey: string;
}): Promise<{ productInfo: any; customizeFields: any[] }> {
  if (!HOST) {
    console.error("getProductPage: NEXT_PUBLIC_HOST 未配置");
    return { productInfo: null, customizeFields: [] };
  }

  const url =
    `${HOST}/config/getProductPage` +
    `?sortKey=${encodeURIComponent(sortKey)}` +
    `&productKey=${encodeURIComponent(productKey)}` +
    `&language=${encodeURIComponent(locale)}`;

  let productInfo = null;
  let customizeFields: any[] = [];

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
      // 定制字段与 product 平级；商品无效时不下发字段。
      if (productInfo) {
        const fields = json?.data?.customizeFields;
        customizeFields = Array.isArray(fields) ? fields : [];
      }
    } else if (res.status === 404) {
      productInfo = null;
    } else {
      throw new Error(
        `getProductPage HTTP ${res.status}: ${sortKey}/${productKey}`
      );
    }
  } catch (err: any) {
    console.error(`getProductPage fetch 失败:`, err?.message);
    // 网络/超时错误不吞掉，避免 use cache 把 null 缓存成「永久 404」
    throw err;
  }

  return { productInfo, customizeFields };
}
