/** @format */

import { notFound } from "next/navigation";

import getRemoteLanguage from "@/config/Api/getRemoteLanguage";
import getRemoteConfig from "@/config/Api/getRemoteConfig";
import getCategoryProducts, {
  getAllCategories
} from "@/config/Api/getCategoryProducts";

import CategoryList from "./components/CategoryList";

// 构建期枚举所有 (locale, sortKey)，预生成分类页；
// 数据源同商品详情页的 getProductPaths，去重到分类粒度。
// 未列出的 sortKey 仍按需生成（dynamicParams 默认 true）。
export async function generateStaticParams() {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_HOST}/config/getProductPaths`
  );
  if (!res.ok) {
    throw new Error(`getProductPaths 失败: HTTP ${res.status}`);
  }
  const json = await res.json();
  const seen = new Set();
  const params = [];
  (json?.data?.list || []).forEach(({ locale, sortKey }) => {
    const k = `${locale}:${sortKey}`;
    if (seen.has(k)) return;
    seen.add(k);
    params.push({ locale, sortKey });
  });
  return params;
}

// 多语言/页面配置改走独立按命名空间接口（后端整形+TTL 缓存，前端开箱即用）：
//   - LANG    ← /config/getLanguageByNamespace（store.index / common.nav / store.product_category）
//   - CONFIG  ← /config/getPageConfigByNamespace（common.base）
// 分类商品走 getCategoryProducts（自带 product:list tag），不读 cookie，保持本路由可静态化（ISR）。
async function getData({ locale, sortKey }) {
  const [LANG, CONFIG, category, categories] = await Promise.all([
    getRemoteLanguage({
      locale,
      nameSpace: ["store.index", "common.nav", "store.product_category"]
    }),
    getRemoteConfig({ locale, nameSpace: ["common.base"] }),
    getCategoryProducts({ locale, sortKey }),
    getAllCategories({ locale })
  ]);
  return { CONFIG, LANG, category, categories };
}

export async function generateMetadata({ params }) {
  const { locale, sortKey } = await params;
  const { CONFIG, category } = await getData({ locale, sortKey });
  const company = CONFIG?.["common.base"]?.company_name;
  if (!category) {
    return { title: company };
  }
  const title = `${category.category.name}${company ? ` - ${company}` : ""}`;
  const description =
    category.category.description ||
    `Shop our ${category.category.name} collection at ${
      company || "our store"
    }.`;
  return {
    title,
    description,
    keywords: category.category.name,
    openGraph: {
      title,
      description,
      images: category.category.image_src
        ? [{ url: category.category.image_src }]
        : category.goodList
            .slice(0, 4)
            .map((p) => ({ url: p.image }))
            .filter((i) => i.url)
    }
  };
}

export default async function ProductCategory({ params }) {
  const { locale, sortKey } = await params;
  const { LANG, category, categories } = await getData({
    locale,
    sortKey
  });

  // 分类不存在 / 该分类下无商品 → 404
  if (!category) {
    notFound();
  }

  return (
    <CategoryList
      category={category.category}
      goodList={category.goodList}
      categories={categories}
      sortKey={sortKey}
      LANG={LANG}
      goodDiscountFestival={undefined}
    />
  );
}
