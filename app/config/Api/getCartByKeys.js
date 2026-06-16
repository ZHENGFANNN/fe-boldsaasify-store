/** @format */

// ============================================================
// 远程数据 API · POST ${HOST}/config/getCartByKeys
// 购物车实时取价：按 area + language + items 三元组拉每行套餐价/库存。
//
// 取代旧「layout 下发静态 us 价 PRODUCT.cart + 前端 find」：
//   - 价格随 area 实时（后端按 country_code 过滤 areaList）；
//   - 只传购物车里实际存在的 keys，按需取数，不再全量下发商品。
// ============================================================

const HOST = process.env.NEXT_PUBLIC_HOST;

// items: [{ sortKey, productKey, comboKey }]
// 返回: [{ id, comboName, comboKey, name, image, sortKey, productKey, areaInfo }]
export default async function getCartByKeys({ area, language, items }) {
  if (!HOST) {
    console.error("getCartByKeys: NEXT_PUBLIC_HOST 未配置");
    return [];
  }
  if (!Array.isArray(items) || items.length === 0) return [];

  let res;
  try {
    res = await fetch(`${HOST}/config/getCartByKeys`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ area, language, items }),
      cache: "no-store",
    });
  } catch (err) {
    console.error("getCartByKeys fetch 失败:", err?.message);
    return [];
  }
  if (!res.ok) {
    console.error("getCartByKeys 异常状态:", res.status);
    return [];
  }
  const json = await res.json().catch(() => null);
  return json?.data?.list || [];
}
