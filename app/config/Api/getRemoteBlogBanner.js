/** @format */

// ============================================================
// 远程数据 API · GET ${HOST}/config/getBlogBanner
// 运行时按 locale 拉取博客 banner（recommend 文章），供 blog 首页独立调用。
//
// 从原 layout 聚合数据中拆出：banner 只在 blog 首页用到，不再混进布局取数。
// 缓存：fetch 级 next:{tags,revalidate}（24h + 按需 revalidateTag('blog:list')）。
// ============================================================

const HOST = process.env.NEXT_PUBLIC_HOST;
const REVALIDATE = 86400; // 24h

const memo = new Map();

export default async function getRemoteBlogBanner({ locale }) {
  if (!HOST) {
    console.error("getRemoteBlogBanner: NEXT_PUBLIC_HOST 未配置");
    return [];
  }
  if (memo.has(locale)) return memo.get(locale);

  const url = `${HOST}/config/getBlogBanner?locale=${encodeURIComponent(
    locale
  )}`;

  let res;
  try {
    res = await fetch(url, {
      next: {
        tags: ["blog:list", `blog:list:${locale}`],
        revalidate: REVALIDATE,
      },
    });
  } catch (err) {
    console.error("getRemoteBlogBanner fetch 失败:", err?.message);
    return [];
  }
  if (!res.ok) {
    console.error("getRemoteBlogBanner 异常状态:", res.status);
    return [];
  }
  const json = await res.json().catch(() => null);
  const list = json?.data?.list || [];
  memo.set(locale, list);
  return list;
}
