/** @format */

// ============================================================
// 远程数据 API · GET ${HOST}/config/getArticleDetail
// app/config/Api 远程数据接口层：运行时从后端拉取数据。
//
// 文章详情：按 sortKey/articleKey 从后端实时拉取单篇文章，并打上缓存 tag。
// 后台改某篇文章后，只需 revalidateTag('article:sortKey:articleKey')
// 即可让该文章页在下次访问时重新生成，无需全站重建（对齐 getBlogDetail）。
// ============================================================

const HOST = process.env.NEXT_PUBLIC_HOST;

// 兜底重新验证周期（秒）。真正的实时性靠 on-demand 的 revalidateTag。
const REVALIDATE_FALLBACK = 86400; // 24h

// 生成文章内标题 id（复刻 getBlogDetail getHeadTitleId）
function getHeadTitleId(title: string) {
  return title
    .toLowerCase()
    .replace(/<[\s\S]*?>([\s\S]*?)<[\s\S]*?>/gi, "$1")
    .replace(/[\'\"?:\.]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

// 给正文 h2/h3 注入 id（复刻 getBlogDetail addHeadTitleId），便于锚点定位。
function addHeadTitleId(html: string) {
  const headerRegex = /<h([23])[^>]*>([\s\S]*?)<\/h\1>/gi;
  let match;
  while ((match = headerRegex.exec(html)) !== null) {
    const contentWithTags = match[0];
    const tagName = `h${match[1]}`;
    const content = match[2];
    const id = getHeadTitleId(content);
    html = html.replace(
      contentWithTags,
      `<${tagName} id="${id}">${content}</${tagName}>`
    );
  }
  return html;
}

// 把后端原始文章对象整形成详情页所需结构。
function buildArticle(raw: any) {
  const { sortInfo, id, ...item } = raw;
  item.articleSortInfo = sortInfo?.[0] || null;
  item.content = addHeadTitleId(item.content || "");
  return item;
}

export default async function getArticleDetail({
  locale,
  sortKey,
  articleKey,
}: {
  locale: string;
  sortKey: string;
  articleKey: string;
}): Promise<any | null> {
  if (!HOST) {
    console.error("getArticleDetail: NEXT_PUBLIC_HOST 未配置");
    return null;
  }
  const tag = `article:${sortKey}:${articleKey}`;
  const url =
    `${HOST}/config/getArticleDetail` +
    `?sortKey=${encodeURIComponent(sortKey)}` +
    `&articleKey=${encodeURIComponent(articleKey)}` +
    `&language=${encodeURIComponent(locale)}`;

  let res;
  try {
    res = await fetch(url, {
      next: { tags: [tag], revalidate: REVALIDATE_FALLBACK },
    });
  } catch (err: any) {
    console.error(`getArticleDetail fetch 失败 ${tag}:`, err?.message);
    return null;
  }
  if (!res.ok) {
    if (res.status !== 404) {
      console.error(`getArticleDetail 异常状态 ${tag}: ${res.status}`);
    }
    return null;
  }
  const json = await res.json().catch(() => null);
  const item = json?.data ?? null;
  if (!item || !item.key) return null;
  return buildArticle(item);
}
