/** @format */

import { NextResponse } from "next/server";
import getProductsCatalog from "@/config/Api/getProductsCatalog";

// ============================================================
// LiveChat 分享商品搜索 · GET /api/products-catalog
//   query: locale, q（关键词，必填才搜）, limit（默认 30）
// 复用 /config/getProduct，服务端按 locale + name 过滤后返回精简列表。
// ============================================================

const SEARCH_LIMIT = 30;
const SMAXAGE = 300;
const SWR = 3600;

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const locale = searchParams.get("locale") || searchParams.get("language") || "en";
  const q = searchParams.get("q") || "";
  const limitRaw = Number(searchParams.get("limit"));
  const limit =
    Number.isFinite(limitRaw) && limitRaw > 0
      ? Math.min(Math.floor(limitRaw), SEARCH_LIMIT)
      : SEARCH_LIMIT;

  if (!String(q).trim()) {
    return NextResponse.json(
      { code: 0, message: "", data: { list: [] } },
      {
        status: 200,
        headers: {
          "Cache-Control": `public, s-maxage=${SMAXAGE}, stale-while-revalidate=${SWR}`,
        },
      }
    );
  }

  const list = await getProductsCatalog({ locale, q, limit });

  return NextResponse.json(
    { code: 0, message: "", data: { list } },
    {
      status: 200,
      headers: {
        "Cache-Control": `public, s-maxage=${SMAXAGE}, stale-while-revalidate=${SWR}`,
      },
    }
  );
}
