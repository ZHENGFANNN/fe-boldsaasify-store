/** @format */

// ============================================================
// 购物车客户端取数（CartModal / 订单页共用）
// 读 localStorage.store_shopping 的 keys → POST /api/cart 实时取价/库存 →
// 合并本地 productNum/options、按库存过滤，返回每行原始数据（含 areaInfo）。
// 各调用方再按各自字段命名映射展示。失败/无数据时返回 []（购物车显示空）。
// ============================================================

function parseOptions(raw) {
  try {
    if (typeof raw === "object") return raw;
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

// 返回: [{ id, comboName, comboKey, name, image, sortKey, productKey,
//          areaInfo:{currency,currency_symbol,currency_unit,product_price,
//          stock}, productNum, options }]
export default async function resolveCartFromApi({ area, language }) {
  let localStoreList;
  try {
    localStoreList = JSON.parse(window.localStorage.getItem("store_shopping") ?? "[]");
  } catch {
    window.localStorage.setItem("store_shopping", JSON.stringify([]));
    return [];
  }
  if (!Array.isArray(localStoreList) || localStoreList.length === 0) return [];

  const items = localStoreList.map((it) => ({
    sortKey: it.sortKey,
    productKey: it.productKey,
    comboKey: it.comboKey,
  }));

  let rows = [];
  try {
    const res = await fetch("/api/cart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ area: area || "us", language, items }),
    });
    if (!res.ok) return [];
    const json = await res.json().catch(() => null);
    rows = json?.data?.list || [];
  } catch (err) {
    console.warn("【购物车取价失败】", err?.message);
    return [];
  }

  // 按 keys 把后端实时数据与本地 productNum/options 合并，库存为真才保留。
  const out = [];
  localStoreList.forEach((local) => {
    const row = rows.find(
      (r) =>
        r.sortKey === local.sortKey &&
        r.productKey === local.productKey &&
        r.comboKey === local.comboKey
    );
    if (!row || !row.areaInfo || !row.areaInfo.stock) return;
    out.push({
      ...row,
      productNum: local.productNum,
      options: parseOptions(local.options),
      // 后端实时取价不含定制数据，从本地购物车行带回，避免下单时丢失
      customize_data: Array.isArray(local.customize_data)
        ? local.customize_data
        : [],
    });
  });
  return out;
}
