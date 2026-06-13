/** @format */

// ============================================================
// 远程数据 API · GET ${HOST}/config/getProduct
// app/config/Api 远程数据接口层：运行时从后端拉取数据。
// ============================================================

// 产品分类页数据：按 locale + sortKey 从后端拉取该分类下的商品列表。
//
// 与 getProductData.js 的区别：那个文件读 area cookie → 强制动态渲染，
// 分类页要整页 SSG，所以这里**不读 cookie**，保留每个商品 comboList[].areaList
// 的完整地区价，由客户端按 area cookie 解析（与商品详情页 BaseLayout 思路一致）。
//
// 数据源与 getProductData 共用 /config/getProduct + tag('product:list')，
// 后台改商品调用 revalidateTag('product:list') 即可让分类页下次访问重建。

const HOST = process.env.NEXT_PUBLIC_HOST;
const REVALIDATE_FALLBACK = 86400; // 24h，兜底；实时性靠 on-demand revalidateTag

// 解析商品标签：读后端 /config/getProduct 返回的真实标签字段（tagList）。
// tagList 元素为 { key, name, language, ... }，统一取 name 成字符串数组；
// 无标签时返回 []（该商品在筛选里不命中任何标签）。
function resolveTags(item) {
  const real = item.tagList || item.tags || null;
  if (!Array.isArray(real)) return [];
  return real
    .map((t) => (typeof t === "string" ? t : t?.name || t?.title))
    .filter(Boolean);
}

// 商品卡片精简：算评分/评论数、取主图，保留 comboList(含 areaList) 供客户端选地区价，
// 附带 tags（商品标签）供客户端筛选。
function toSimpleProduct(item) {
  const { reviewsList, reviews_num, reviews_score, image_list } = item;
  const totalScore = reviewsList?.reduce((pre, cur) => pre + cur.score, 0);
  return {
    key: item.key,
    sort_key: item.sort_key,
    name: item.name,
    description: item.description,
    image: image_list?.[0]?.src,
    image_scenes: item.image_scenes,
    image_list: image_list,
    reviewScore: totalScore / reviewsList?.length || reviews_score,
    reviewsNum: reviewsList?.length || reviews_num,
    reviews_score,
    reviews_num,
    weight: item.weight,
    comboList: Array.isArray(item.comboList) ? item.comboList : [],
    tags: resolveTags(item),
  };
}

/**
 * @returns {Promise<{ category: object, goodList: object[] } | null>}
 *   category: { key, name, description, image_src, weight }，sortKey 无对应分类时为 null
 *   找不到该分类（无商品 / 接口失败）时整体返回 null，页面据此走 notFound。
 */
export default async function getCategoryProducts({ locale, sortKey }) {
  if (!HOST) {
    console.error("getCategoryProducts: NEXT_PUBLIC_HOST 未配置");
    return null;
  }

  let res;
  try {
    res = await fetch(`${HOST}/config/getProduct`, {
      next: { tags: ["product:list"], revalidate: REVALIDATE_FALLBACK },
    });
  } catch (err) {
    console.error("getCategoryProducts fetch 失败:", err?.message);
    return null;
  }
  if (!res.ok) {
    console.error("getCategoryProducts 异常状态:", res.status);
    return null;
  }

  const json = await res.json().catch(() => null);
  const list = json?.data?.list || [];

  // 按 locale 过滤（无该语言回退英文），再按 sortKey 收敛到当前分类。
  const byLang = {};
  list.forEach((item) => {
    (byLang[item.language] ||= []).push(item);
  });
  const localeList = byLang[locale] || byLang["en"] || [];

  let category = null;
  const goodList = [];
  localeList.forEach((item) => {
    if (item.sort_key !== sortKey) return;
    const sortInfo = item.goodSort?.[0];
    if (!sortInfo?.enabled) return; // 分类未启用 → 跳过
    if (!category) {
      category = {
        key: sortInfo.key,
        name: sortInfo.name,
        description: sortInfo.description,
        image_src: sortInfo.image_src,
        weight: sortInfo.weight,
      };
    }
    goodList.push(toSimpleProduct(item));
  });

  if (!category || goodList.length === 0) return null;

  goodList.sort((a, b) => (b.weight || 0) - (a.weight || 0));
  return { category, goodList };
}

// 供分类导航/面包屑用：返回全部启用分类（去重、按权重降序）。
export async function getAllCategories({ locale }) {
  if (!HOST) return [];
  let res;
  try {
    res = await fetch(`${HOST}/config/getProduct`, {
      next: { tags: ["product:list"], revalidate: REVALIDATE_FALLBACK },
    });
  } catch {
    return [];
  }
  if (!res.ok) return [];
  const json = await res.json().catch(() => null);
  const list = json?.data?.list || [];
  const byLang = {};
  list.forEach((item) => {
    (byLang[item.language] ||= []).push(item);
  });
  const localeList = byLang[locale] || byLang["en"] || [];

  const map = {};
  localeList.forEach((item) => {
    const s = item.goodSort?.[0];
    if (!s?.enabled || map[s.key]) return;
    map[s.key] = { key: s.key, name: s.name, weight: s.weight };
  });
  return Object.values(map).sort((a, b) => (b.weight || 0) - (a.weight || 0));
}
