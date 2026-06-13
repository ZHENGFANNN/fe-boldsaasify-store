/** @format */

import { NextResponse } from "next/server";
import { getProductPricing } from "@/config/Api/getProductPricing";

// ============================================================
// 定价转发缓存路由 · GET /api/product-pricing
// 作用：把后端 /config/getProductPricing 做一层 Next 转发。
//   - 复用 config/Api/getProductPricing 的 fetch（带 next:{tags,revalidate}），
//     按 sortKey/productKey/area 这个 key 进 Next 数据缓存；
//   - 响应再带 Cache-Control(s-maxage + SWR)，让 Cloudflare CDN/浏览器
//     按本路由 URL（含 query = 同一个 key）二级缓存。
// 客户端 BaseLayout 非 us 地区补差时改打这里，命中缓存即秒回，避免每次回源 Go。
// ============================================================

// 与 getProductPricing 的 REVALIDATE_FALLBACK 对齐（秒）。
const SMAXAGE = 86400; // 24h
const SWR = 604800; // 7d

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const sortKey = searchParams.get("sortKey");
  const productKey = searchParams.get("productKey");
  const area = searchParams.get("area");
  const locale = searchParams.get("language") || searchParams.get("locale");

  if (!sortKey || !productKey || !area) {
    return NextResponse.json(
      { code: -1, message: "missing sortKey/productKey/area", data: null },
      { status: 400 }
    );
  }

  // 复用服务端取价（内部 fetch 已按 key 打 tag + revalidate 进 Next 数据缓存）。
  const data = await getProductPricing({ sortKey, productKey, area, locale });

  if (!data) {
    // 取价失败/404：不缓存，让客户端退回 us 价。
    return NextResponse.json(
      { code: -1, message: "no pricing", data: null },
      { status: 200, headers: { "Cache-Control": "no-store" } }
    );
  }

  return NextResponse.json(
    { code: 0, message: "", data },
    {
      status: 200,
      headers: {
        "Cache-Control": `public, s-maxage=${SMAXAGE}, stale-while-revalidate=${SWR}`,
      },
    }
  );
}
