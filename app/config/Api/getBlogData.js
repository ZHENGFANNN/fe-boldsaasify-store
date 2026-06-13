/** @format */

// ============================================================
// 远程数据 API · GET ${HOST}/config/getBlog
// app/config/Api 远程数据接口层：运行时从后端拉取数据。
// ============================================================

// Blog 列表数据层（运行时从后端拉取，不再读本地物化 JSON / layout 静态文件）。
//
// 复刻 script/fetch-blog.js 的整形逻辑：按 locale 过滤全量文章列表，
// 构造 "banner" / "sort" 命名空间结构。文章「详情」走 getBlogDetail
// （已整页静态化 + tag），与此文件解耦。

const HOST = process.env.NEXT_PUBLIC_HOST;
const REVALIDATE = 86400; // 24h，配合后台 on-demand revalidateTag('blog:list')

// 拉取后端全量文章列表，按 locale 过滤（无配置回退英文）。
async function fetchBlogListByLocale(locale) {
  if (!HOST) {
    console.error("getBlogData: NEXT_PUBLIC_HOST 未配置");
    return [];
  }
  let res;
  try {
    res = await fetch(`${HOST}/config/getBlog`, {
      next: { tags: ["blog:list"], revalidate: REVALIDATE },
    });
  } catch (err) {
    console.error("getBlogData fetch 失败:", err?.message);
    return [];
  }
  if (!res.ok) {
    console.error("getBlogData 异常状态:", res.status);
    return [];
  }
  const json = await res.json().catch(() => null);
  const list = json?.data?.list || [];
  const byLang = {};
  list.forEach((item) => {
    if (!byLang[item.language]) byLang[item.language] = [];
    byLang[item.language].push(item);
  });
  return byLang[locale] || byLang["en"] || [];
}

// 构造 banner / sort / layout（复刻 fetch-blog.js handleBlogData 对应部分）
function buildBlogData(list) {
  const banner = [];
  const sort = {};
  list.forEach(({ sortInfo, ...item }) => {
    const blogSortInfo = sortInfo?.[0];

    // banner
    if (item.recommend) {
      banner.push({
        image: item.image,
        title: item.title,
        key: item.key,
        sort_key: item.sort_key,
      });
    }

    // sort 分组
    const blogSortArticleItem = {
      image: item.image,
      title: item.title,
      key: item.key,
      sort_key: item.sort_key,
      updated_time: item.updated_time,
    };
    if (blogSortInfo) {
      sort[item.sort_key] = {
        weight: blogSortInfo.weight,
        key: blogSortInfo.key,
        name: blogSortInfo.name,
        blogList: sort[item.sort_key]
          ? [...sort[item.sort_key].blogList, blogSortArticleItem]
          : [blogSortArticleItem],
      };
    }
  });

  // layout（footer 导航 + 顶部 nav）
  const footer = Object.keys(sort)
    .filter((_, index) => index < 8)
    .map((key) =>
      sort[key] ? { name: sort[key].name, key: sort[key].key } : {}
    );
  const nav = list
    .filter((_, index) => index < 8)
    .map(({ title, key, sort_key }) => ({ title, key, sort_key }));
  const layout = { footer, nav };

  return { banner, sort, layout };
}

const localeData = new Map();
async function getData({ locale }) {
  const cacheKey = `${locale}`;
  if (localeData.has(cacheKey)) return localeData.get(cacheKey);
  const list = await fetchBlogListByLocale(locale);
  const data = buildBlogData(list);
  localeData.set(cacheKey, data);
  return data;
}

export default async function getBlogList({
  locale,
  configList,
  blogNameSpace,
}) {
  if (!configList.includes("blog")) return null;
  const source = await getData({ locale });
  const resMap = {};
  // 仅返回页面请求的命名空间（banner / sort / layout）。
  blogNameSpace.forEach((nameSpace) => {
    resMap[nameSpace] = source[nameSpace] ?? null;
  });
  return resMap;
}
