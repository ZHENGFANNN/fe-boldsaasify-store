/** @format */

// ============================================================
// 远程数据 API · GET ${HOST}/config/getPageConfigByNamespace
// 运行时按 (locale, nameSpace) 独立拉取页面配置切片。
//
// 后端已完成 page+global 合并、JSON 解析、common.base 默认语言合并、en 兜底，
// 返回 { code: <已解析的值> }，前端直接消费（无需再 JSON.parse / 过滤）。
//
// 缓存：只走 Next fetch 级 next:{tags,revalidate}（24h + 按需 revalidateTag）。
//   tag 与 (locale, nameSpace) 强关联，页面用到哪些 key 就只缓存/失效哪些：
//     - "config:page"                      全量（兜底，刷所有页面配置）
//     - "config:page:<locale>"             按地区
//     - "config:page:<locale>:<nameSpace>" 按 (地区, 命名空间) —— 最细粒度
//   后端改某命名空间配置 → 只 revalidate 对应细粒度 tag，不波及其它切片。
//
// ⚠️ 曾有进程级 memo Map 缓存，已删除：
//   memo 生命周期 = Node/Worker 进程，比 Next fetch 更早命中且不受 revalidateTag 影响，
//   会造成"后端已改 + tag 已 revalidate，但 memo 未清 → 前台永远拿旧数据"的运维坑。
//   Next fetch 自身已有同请求 dedupe + tag revalidate，无需再叠一层。
// ============================================================

const HOST = process.env.NEXT_PUBLIC_HOST;
const REVALIDATE = 86400; // 24h

// 由 (locale, nameSpace[]) 推导分层缓存 tag：全量 → 按地区 → 按 (地区, 命名空间)。
function buildTags(locale: string, list: string[]): string[] {
  const tags = ["config:page", `config:page:${locale}`];
  for (const ns of list) {
    tags.push(`config:page:${locale}:${ns}`);
  }
  return tags;
}

export default async function getRemoteConfig({
  locale,
  nameSpace = [],
}: {
  locale: string;
  nameSpace?: string | string[];
}): Promise<Record<string, any>> {
  const list = Array.isArray(nameSpace) ? nameSpace : [nameSpace];
  if (!list.length) return {};
  if (!HOST) {
    console.error("getRemoteConfig: NEXT_PUBLIC_HOST 未配置");
    return {};
  }

  const ns = list.join(",");
  const url = `${HOST}/config/getPageConfigByNamespace?locale=${encodeURIComponent(
    locale
  )}&nameSpace=${encodeURIComponent(ns)}`;

  let res;
  try {
    res = await fetch(url, {
      next: { tags: buildTags(locale, list), revalidate: REVALIDATE }
    });
  } catch (err: any) {
    console.error("getRemoteConfig fetch 失败:", err?.message);
    return {};
  }
  if (!res.ok) {
    console.error("getRemoteConfig 异常状态:", res.status);
    return {};
  }
  const json = await res.json().catch(() => null);
  return json?.data || {};
}
