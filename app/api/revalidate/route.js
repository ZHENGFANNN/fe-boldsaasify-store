/** @format */

import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { getCloudflareContext } from "@opennextjs/cloudflare";

// On-demand 重新验证：后台改商品后由 Go 后端调用本接口，
// 按 tag(`product:sortKey:productKey`) 让对应商品页在下次访问时重建。
export const dynamic = "force-dynamic";

function readSecret() {
  try {
    const { env } = getCloudflareContext();
    if (env?.REVALIDATE_SECRET) return env.REVALIDATE_SECRET;
  } catch {
    // build/无请求上下文时忽略
  }
  return process.env.REVALIDATE_SECRET;
}

export async function POST(request) {
  const expected = readSecret();
  const provided =
    request.headers.get("x-revalidate-secret") ||
    new URL(request.url).searchParams.get("secret");

  if (!expected || provided !== expected) {
    return NextResponse.json(
      { ok: false, message: "invalid secret" },
      { status: 401 }
    );
  }

  let body = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const tags = [];
  if (body.tag) tags.push(body.tag);
  if (Array.isArray(body.tags)) tags.push(...body.tags);
  if (body.sortKey && body.productKey) {
    tags.push(`product:${body.sortKey}:${body.productKey}`);
  }

  if (tags.length === 0) {
    return NextResponse.json(
      { ok: false, message: "no tag provided" },
      { status: 400 }
    );
  }

  const unique = [...new Set(tags)];
  unique.forEach((t) => revalidateTag(t));

  return NextResponse.json({ ok: true, revalidated: unique });
}
