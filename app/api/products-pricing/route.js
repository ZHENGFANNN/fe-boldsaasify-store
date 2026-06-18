/** @format */

import { NextResponse } from "next/server";
import { getProductsPricing } from "@/config/Api/getProductsPricing";

// ============================================================
// 批量定价转发缓存路由 · GET /api/products-pricing
// 作用：把后端 /config/getProductsPricing 做一层 Next 转发。
//   - 复用 config/Api/getProductsPricing 的 fetch（带 next:{tags,revalidate}），
//     按 area+sorted(keys) 这个 key 进 Next 数据缓存；
//   - 响应再带 Cache-Control(s-maxage + SWR)，让 Cloudflare CDN/浏览器
//     按本路由 URL（含 query = 同一个 key）二级缓存。
// 客户端 IndexProductList / CategoryList 在 areaReady 后打这里一次取齐当前地区全部价格。
// ============================================================

const SMAXAGE = 86400; // 24h
const SWR = 604800; // 7d

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const area = searchParams.get("area") || "us";
  const locale = searchParams.get("language") || searchParams.get("locale") || "en";
  const keysRaw = searchParams.get("keys") || "";

  const pairs = keysRaw
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => {
      const [sortKey, productKey] = p.split(":");
      return { sortKey: (sortKey || "").trim(), productKey: (productKey || "").trim() };
    })
    .filter((p) => p.sortKey && p.productKey);

  if (pairs.length === 0) {
    return NextResponse.json(
      { code: -1, message: "missing keys", data: null },
      { status: 400 }
    );
  }

  const data = await getProductsPricing({ area, locale, keys: pairs });

  if (!data) {
    // 取价失败：不缓存，让客户端兜底（继续显示骨架或 fallback）。
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
