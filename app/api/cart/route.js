import { NextResponse } from "next/server";
import getCartByKeys from "@/config/Api/getCartByKeys";

// ============================================================
// 购物车实时取价路由 · POST /api/cart
// 作用：把后端 /config/getCartByKeys 做一层 Next 转发。
//   body: { area, language, items:[{sortKey,productKey,comboKey}] }
//   - 价格随 area 实时，故不缓存（no-store）；
//   - 客户端 CartModal / 订单页用本地 store_shopping 的 keys 调用，拿实时价/库存。
// ============================================================

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { code: -1, message: "invalid body", data: null },
      { status: 400 }
    );
  }

  const { area, language, items } = body || {};
  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json(
      { code: 0, message: "", data: { list: [] } },
      { status: 200, headers: { "Cache-Control": "no-store" } }
    );
  }

  const list = await getCartByKeys({
    area: area || "us",
    language: language || "en",
    items
  });

  return NextResponse.json(
    { code: 0, message: "", data: { list } },
    { status: 200, headers: { "Cache-Control": "no-store" } }
  );
}
