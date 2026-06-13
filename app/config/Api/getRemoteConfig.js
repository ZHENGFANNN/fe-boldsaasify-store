/** @format */

// ============================================================
// 远程数据 API · GET ${HOST}/config/getPageConfigByNamespace
// 运行时按 (locale, nameSpace) 独立拉取页面配置切片。
//
// 后端已完成 page+global 合并、JSON 解析、common.base 默认语言合并、en 兜底，
// 返回 { code: <已解析的值> }，前端直接消费（无需再 JSON.parse / 过滤）。
//
// 缓存：fetch 级 next:{tags,revalidate}（24h + 按需 revalidateTag('config:page')），
//      叠加后端进程内 TTL。
// ============================================================

const HOST = process.env.NEXT_PUBLIC_HOST;
const REVALIDATE = 86400; // 24h

const memo = new Map();

export default async function getRemoteConfig({ locale, nameSpace = [] }) {
  const list = Array.isArray(nameSpace) ? nameSpace : [nameSpace];
  if (!list.length) return {};
  if (!HOST) {
    console.error("getRemoteConfig: NEXT_PUBLIC_HOST 未配置");
    return {};
  }

  const ns = list.join(",");
  const cacheKey = `${locale}:${ns}`;
  if (memo.has(cacheKey)) return memo.get(cacheKey);

  const url = `${HOST}/config/getPageConfigByNamespace?locale=${encodeURIComponent(
    locale
  )}&nameSpace=${encodeURIComponent(ns)}`;

  let res;
  try {
    res = await fetch(url, {
      next: { tags: ["config:page"], revalidate: REVALIDATE }
    });
  } catch (err) {
    console.error("getRemoteConfig fetch 失败:", err?.message);
    return {};
  }
  if (!res.ok) {
    console.error("getRemoteConfig 异常状态:", res.status);
    return {};
  }
  const json = await res.json().catch(() => null);
  const data = json?.data || {};
  memo.set(cacheKey, data);
  return data;
}
