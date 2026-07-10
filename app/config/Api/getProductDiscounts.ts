/** @format */

// ============================================================
// 远程数据 API · POST ${HOST}/pay/getProductDiscounts（order-service）
// 批量查询商品命中的自动折扣（product_amount_off 限时促销）。
// 供 /api/products-offer 服务端聚合调用，把折扣与价格 join 后一次下发前端。
//
// order-service 单次批量上限 50（防公开接口 CPU 放大），这里按 50 分片并发查询后合并，
// 让大分类页也能拿到折扣。折扣为「尽力而为」：任一分片失败只返回该片为空，
// 不抛错、不影响价格（调用方 join 时缺失即 discount=null）。
// ============================================================

const HOST = process.env.NEXT_PUBLIC_HOST;
const MAX_PER_CALL = 50;

export interface ProductDiscount {
  product_key: string;
  value_type: string; // "percent" | "fixed"
  value: string;
  ends_at: number; // 毫秒时间戳；0 = 永不过期
  title: string;
}

async function fetchChunk(
  areaCode: string,
  chunk: Array<{ sortKey: string; productKey: string }>
): Promise<ProductDiscount[]> {
  try {
    const res = await fetch(`${HOST}/pay/getProductDiscounts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        area_code: areaCode,
        product_list: chunk.map((k) => ({
          product_key: k.productKey,
          sort_key: k.sortKey,
        })),
      }),
      // 折扣带 ends_at 时效，且 order-service 查询本身很轻：不进 Next 数据缓存，
      // 每次取最新，缓存交由外层 /api/products-offer 路由的短 TTL(CDN) 兜。
      cache: "no-store",
    });
    if (!res.ok) return [];
    const json = await res.json().catch(() => null);
    if (json?.code !== 0) return [];
    return Array.isArray(json.data?.discounts) ? json.data.discounts : [];
  } catch (err: any) {
    console.error("getProductDiscounts fetch 失败:", err?.message);
    return [];
  }
}

/**
 * 批量取商品自动折扣。
 * @param area  地区码（缺省 us）。
 * @param keys  [{sortKey, productKey}]，内部按 50 分片查询后合并。
 * @returns 折扣数组（按 product_key 命中）；失败/无数据返回空数组（调用方降级为无折扣）。
 */
export async function getProductDiscounts({
  area,
  keys,
}: {
  area: string;
  keys: Array<{ sortKey: string; productKey: string }>;
}): Promise<ProductDiscount[]> {
  if (!HOST) {
    console.error("getProductDiscounts: NEXT_PUBLIC_HOST 未配置");
    return [];
  }
  const areaCode = (area || "us").toLowerCase();
  const list = (keys || []).filter((k) => k?.sortKey && k?.productKey);
  if (list.length === 0) return [];

  const chunks: Array<Array<{ sortKey: string; productKey: string }>> = [];
  for (let i = 0; i < list.length; i += MAX_PER_CALL) {
    chunks.push(list.slice(i, i + MAX_PER_CALL));
  }
  const results = await Promise.all(chunks.map((c) => fetchChunk(areaCode, c)));
  return results.flat();
}

export default getProductDiscounts;
