/** @format */

import getRemoteLanguage from "@/config/Api/getRemoteLanguage";
import getRemoteConfig from "@/config/Api/getRemoteConfig";
import getRemoteProductList from "@/config/Api/getRemoteProductList";

import IndexContext from "../components/IndexContext";
import IndexProductList from "../components/IndexProductList";
import IndexProductLdJson from "../components/IndexProductLdJson";

import { buildAlternates } from "@/config/seo";
import { mergeMeta } from "@/config/mergeMeta";

import styles from "./page.module.scss";

// ============================================================
// /product —— 全部商品（按分类分组）。
//
// 本页承接「改版前的首页主体」：原首页就是 IndexBanner + IndexProductList，
// 其中 IndexProductList 本身即「按分类分组的 shop all」，语义上属于商品列表页而非首页，
// 故整体搬到这里；首页改为分类卡/热卖位/文章位的导购版式（见 ../page.jsx）。
//
// 与原首页的两处刻意差异：
//   1. 不带 IndexBanner —— 首页 KV 轮播放在商品列表页语义不对，改为页面 h1 标题。
//      （IndexProductList 内部每个分类是 h2，本页需要一个 h1 才符合文档结构/SEO。）
//   2. 不带 IndexSale —— 它在商品级折扣下线后已是 `return null` 的空实现，搬过来没有意义。
//
// 数据源与原首页一致（纯 SSG，构建期固化，靠「发布」重建）：
//   - LANG    ← /config/getLanguageByNamespace
//   - CONFIG  ← /config/getPageConfigByNamespace（common.base）
//   - 产品列表 ← getRemoteProductList（comboList 仅含 key + associate_country_key，
//               价格/折扣由客户端 IndexProductList 按 area cookie 调 /api/products-offer 取齐）
// 不读 area cookie → 整页可静态化；JSON-LD 由 IndexProductLdJson 以默认 area 价兜底输出。
// ⚠️ 已知遗留缺陷（原首页带过来的，本次未修）：IndexProductLdJson 内部用 next/script 输出，
//    结构化数据只存在于 RSC payload、不进静态 HTML，不执行 JS 的爬虫看不到。
//    要真正生效需改为 server component 直接写原生 <script type="application/ld+json">
//    （并把 `<` 转义成 < 防后台文案注入）—— 属独立问题，另有 4 处同症状组件。
// 静态路由，无动态段，故不需要 generateStaticParams。
// ============================================================
async function getData({ locale }) {
  const [LANG, CONFIG, goodsSortList] = await Promise.all([
    getRemoteLanguage({
      locale,
      nameSpace: ["home", "common.advantage", "common.nav", "product.category"]
    }),
    getRemoteConfig({ locale, nameSpace: ["common.base"] }),
    getRemoteProductList({ locale })
  ]);

  return { LANG, CONFIG, goodsSortList };
}

export async function generateMetadata({ params }) {
  const { locale } = await params;
  const { LANG, CONFIG } = await getData({ locale });
  const company = CONFIG?.["common.base"]?.company_name;
  const heading = LANG?.["product.all_title"] || "All Products";
  const title = company ? `${heading} - ${company}` : heading;
  return mergeMeta(
    {
      title,
      description:
        LANG?.["product.all_description"] ||
        `Browse the full ${heading.toLowerCase()} collection${
          company ? ` at ${company}` : ""
        }.`,
      alternates: buildAlternates("/product", locale)
    },
    "/product"
  );
}

export default async function AllProducts({ params }) {
  const { locale } = await params;
  const { CONFIG, LANG, goodsSortList } = await getData({ locale });

  return (
    <main>
      {/* 页面 h1：IndexProductList 内每个分类用 h2，此处补顶层标题保证文档结构正确。 */}
      <div className={styles.head}>
        <h1 className={styles.title}>
          {LANG?.["product.all_title"] || "All Products"}
        </h1>
      </div>
      <IndexContext
        CONFIG={CONFIG}
        LANG={LANG}
        goodsSortList={goodsSortList}
        locale={locale}
      >
        <IndexProductList />
      </IndexContext>
      {/* 逐商品 Product/Offer JSON-LD，SSG 阶段以默认 area 价兜底（见上方已知缺陷说明）。 */}
      <IndexProductLdJson
        goodsSortList={goodsSortList}
        locale={locale}
        companyName={CONFIG?.["common.base"]?.company_name}
      />
    </main>
  );
}
