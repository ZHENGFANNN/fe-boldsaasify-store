/** @format */

import { NextResponse } from "next/server";
import { getProductsPricing } from "@/config/Api/getProductsPricing";
import { getProductDiscounts } from "@/config/Api/getProductDiscounts";

// ============================================================
// 价格 + 折扣聚合路由 · GET /api/products-offer
// 把「价格」(user-service /config/getProductsPricing) 与「自动折扣」
// (order-service /pay/getProductDiscounts) 在服务端并行取回后 join，
// 前端一次调用即拿到 { combos(原价) + discount(折扣规则) }，
// 消灭客户端两次请求 + 手动按 product_key 对齐。
//
// 取代旧的 /api/product-pricing、/api/products-pricing（价）与客户端直连
// /pay/getProductDiscounts（折扣）三条分裂链路。
//
// 设计要点：
//  - 价格是底座、折扣尽力而为：折扣挂了/分片失败只是 discount=null，价格照常返回，
//    保持「价格永远在、折扣尽力而为」的既有行为，不让二者失败耦合。
//  - 缓存取二者中更严格的一侧：折扣有 ends_at 时效，s-maxage 用短 TTL(60s)，
//    不能沿用价格的 24h；折扣过期兜底另由前端 pickAutoDiscount 按 ends_at 二次过滤。
//  - 价格 fetch 仍复用 config/Api/getProductsPricing 的 Next 数据缓存 + tag 失效；
//    折扣走 no-store 每次取最新。
// ============================================================

const SMAXAGE = 60; // 折扣时效敏感，短缓存
const SWR = 300;

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const area = searchParams.get("area") || "us";
  const locale =
    searchParams.get("language") || searchParams.get("locale") || "en";
  const keysRaw = searchParams.get("keys") || "";

  const pairs = keysRaw
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => {
      const [sortKey, productKey] = p.split(":");
      return {
        sortKey: (sortKey || "").trim(),
        productKey: (productKey || "").trim(),
      };
    })
    .filter((p) => p.sortKey && p.productKey);

  if (pairs.length === 0) {
    return NextResponse.json(
      { code: -1, message: "missing keys", data: null },
      { status: 400 }
    );
  }

  // 价格与折扣并行取。价格失败 → 整体失败（价格是底座）；折扣失败 → 降级为无折扣。
  const [pricing, discounts] = await Promise.all([
    getProductsPricing({ area, locale, keys: pairs }),
    getProductDiscounts({ area, keys: pairs }),
  ]);

  if (!pricing) {
    // 取价失败：不缓存，让客户端兜底（继续显示骨架或 fallback）。
    return NextResponse.json(
      { code: -1, message: "no pricing", data: null },
      { status: 200, headers: { "Cache-Control": "no-store" } }
    );
  }

  const discountMap = {};
  (discounts || []).forEach((d) => {
    if (d && d.product_key) discountMap[d.product_key] = d;
  });

  // 折扣按 product_key 嵌进各价格单元；无命中为 null。
  const list = (pricing.list || []).map((item) => ({
    ...item,
    discount: discountMap[item.productKey] || null,
  }));

  return NextResponse.json(
    { code: 0, message: "", data: { area: pricing.area || area, list } },
    {
      status: 200,
      headers: {
        "Cache-Control": `public, s-maxage=${SMAXAGE}, stale-while-revalidate=${SWR}`,
      },
    }
  );
}
