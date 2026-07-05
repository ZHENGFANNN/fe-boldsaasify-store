/** @format */

// ============================================================
// 远程数据 API · GET ${HOST}/config/getLanguageByNamespace
// 运行时按 (locale, nameSpace) 独立拉取多语言切片。
//
// 与旧的「读本地物化 languageList JSON + 前端过滤」不同：
//   - 命名空间 rename / 前端 key 回填 / en 兜底等整形已下沉到后端；
//   - 前端只传 locale + nameSpace，拿到的即开箱即用的 { feKey: 文案 }。
//
// 缓存：fetch 级 next:{tags,revalidate}（24h + 按需 revalidateTag）。
//   tag 与 (locale, nameSpace) 强关联，页面用到哪些 key 就只缓存/失效哪些：
//     - "config:language"                      全量（兜底，刷所有多语言）
//     - "config:language:<locale>"             按地区
//     - "config:language:<locale>:<nameSpace>" 按 (地区, 命名空间) —— 最细粒度
//   后端改某命名空间文案 → 只 revalidate 对应细粒度 tag，不波及其它切片。
//   同一渲染周期内 dedupe 由进程内 Map 兜底。
// ============================================================

const HOST = process.env.NEXT_PUBLIC_HOST;
const REVALIDATE = 86400; // 24h

const memo = new Map<string, Record<string, string>>();

// 由 (locale, nameSpace[]) 推导分层缓存 tag：全量 → 按地区 → 按 (地区, 命名空间)。
function buildTags(locale: string, list: string[]): string[] {
  const tags = ["config:language", `config:language:${locale}`];
  for (const ns of list) {
    tags.push(`config:language:${locale}:${ns}`);
  }
  return tags;
}

export default async function getRemoteLanguage({
  locale,
  nameSpace = [],
}: {
  locale: string;
  nameSpace?: string | string[];
}): Promise<Record<string, string>> {
  const list = Array.isArray(nameSpace) ? nameSpace : [nameSpace];
  if (!list.length) return {};
  if (!HOST) {
    console.error("getRemoteLanguage: NEXT_PUBLIC_HOST 未配置");
    return {};
  }

  const ns = list.join(",");
  const cacheKey = `${locale}:${ns}`;
  if (memo.has(cacheKey)) return memo.get(cacheKey);

  const url = `${HOST}/config/getLanguageByNamespace?locale=${encodeURIComponent(
    locale
  )}&nameSpace=${encodeURIComponent(ns)}`;

  console.log("===> URL :", url);

  let res;
  try {
    res = await fetch(url, {
      next: { tags: buildTags(locale, list), revalidate: REVALIDATE }
    });
  } catch (err: any) {
    console.error("getRemoteLanguage fetch 失败:", err?.message);
    return {};
  }
  if (!res.ok) {
    console.error("getRemoteLanguage 异常状态:", res.status);
    return {};
  }
  const json = await res.json().catch(() => null);
  const data = json?.data || {};
  memo.set(cacheKey, data);
  return data;
}
