/** @format */

// ============================================================
// 远程数据 API · GET ${HOST}/config/getBlogDetail
// app/config/Api 远程数据接口层：运行时从后端拉取数据。
// ============================================================

// 文章详情：按 sortKey/blogKey 从后端实时拉取单篇文章，并打上缓存 tag。
// 后台改某篇文章后，只需 revalidateTag('blog:sortKey:blogKey')
// 即可让该文章页在下次访问时重新生成，无需全站重建。
//
// 注意：这里返回的是「未按地区过滤」的完整文章 —— 关联商品 associateProduct
// 内 comboItem.areaList 全量保留。按地区选价(areaInfo)的逻辑下沉到客户端
// ProductModal，以便整页可静态缓存。
//
// 本文件是 getProductDetail.js 的镜像，整形逻辑复刻自 script/fetch-blog.js。

const HOST = process.env.NEXT_PUBLIC_HOST;

// 兜底重新验证周期（秒）。真正的实时性靠 on-demand 的 revalidateTag。
const REVALIDATE_FALLBACK = 86400; // 24h

// 关联商品整形：复刻 fetch-blog.js handleAProductList。
// 保留完整 comboItem（含 areaList），客户端再按 area 选价。
function handleAProductList(productList: any[]) {
  if (Array.isArray(productList) && productList.length > 0) {
    return productList.map(
      ({
        reviewsList,
        image_list,
        reviews_num,
        reviews_score,
        comboList,
        ...item
      }) => {
        const totalScore = reviewsList?.reduce(
          (pre: number, cur: any) => pre + cur.score,
          0
        );
        item.reviewScore = totalScore / reviewsList?.length || reviews_score;
        item.reviewsNum = reviewsList?.length || reviews_num;
        item.image = image_list?.[0]?.src;
        const { img_list, ...newComboItem } = comboList?.[0] || {};
        item.comboItem = newComboItem || {};
        return item;
      }
    );
  }
  return [];
}

// 生成文章内标题 id（复刻 fetch-blog.js getHeadTitleId）
function getHeadTitleId(title: string) {
  return title
    .toLowerCase()
    .replace(/<[\s\S]*?>([\s\S]*?)<[\s\S]*?>/gi, "$1")
    .replace(/[\'\"?:\.]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

// 解析 h2/h3 标题列表，供 ArticleNav 使用（复刻 fetch-blog.js getHeadTitleList）
function getHeadTitleList(html: string) {
  const headerRegex = /<h([23])[^>]*>([\s\S]*?)<\/h\1>/gi;
  const tagRegex = /<\/?[^>]+(>|$)/g;
  const matches = [];
  let match;
  while ((match = headerRegex.exec(html)) !== null) {
    const contentWithTags = match[0];
    const tagName = `h${match[1]}`;
    const id = getHeadTitleId(match[2]);
    const content = contentWithTags.replace(tagRegex, "").trim();
    matches.push({ tag: tagName, content, id });
  }
  return matches;
}

// 给正文 h2/h3 注入 id（复刻 fetch-blog.js addHeadTitleId）
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
// 等价于 fetch-blog.js 里 obj[`article:sort:key`] 的构造。
function buildArticle(raw: any) {
  const { sortInfo, id, created_time, language, ...item } = raw;
  const blogSortInfo = sortInfo?.[0];
  item.blogSortInfo = blogSortInfo;
  item.content = addHeadTitleId(item.content || "");
  item.titleList = getHeadTitleList(item.content);
  item.associateProduct = handleAProductList(item.associateProduct);
  if (!Array.isArray(item.associateArticle)) item.associateArticle = [];
  return item;
}

export default async function getBlogDetail({
  locale,
  sortKey,
  blogKey,
}: {
  locale: string;
  sortKey: string;
  blogKey: string;
}): Promise<any | null> {
  if (!HOST) {
    console.error("getBlogDetail: NEXT_PUBLIC_HOST 未配置");
    return null;
  }
  const tag = `blog:${sortKey}:${blogKey}`;
  const url =
    `${HOST}/config/getBlogDetail` +
    `?sortKey=${encodeURIComponent(sortKey)}` +
    `&blogKey=${encodeURIComponent(blogKey)}` +
    `&language=${encodeURIComponent(locale)}`;

  let res;
  try {
    res = await fetch(url, {
      next: { tags: [tag], revalidate: REVALIDATE_FALLBACK },
    });
  } catch (err: any) {
    console.error(`getBlogDetail fetch 失败 ${tag}:`, err?.message);
    return null;
  }
  if (!res.ok) {
    if (res.status !== 404) {
      console.error(`getBlogDetail 异常状态 ${tag}: ${res.status}`);
    }
    return null;
  }
  const json = await res.json().catch(() => null);
  const item = json?.data ?? null;
  if (!item || !item.key) return null;
  return buildArticle(item);
}
