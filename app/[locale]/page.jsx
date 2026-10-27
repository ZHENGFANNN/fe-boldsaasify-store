import getRemoteLanguage from "@/config/Api/getRemoteLanguage";
import getRemoteConfig from "@/config/Api/getRemoteConfig";
import getSortList from "@/config/Api/getSortList";
import getTagProducts from "@/config/Api/getTagProducts";
import getTagBlogs from "@/config/Api/getTagBlogs";

import IndexContext from "./components/IndexContext";
import IndexBanner from "./components/IndexBanner";
import CategoryModule from "./components/CategoryModule";
import BestSellersModule from "./components/BestSellersModule";
import BlogModule from "./components/BlogModule";

import { buildAlternates } from "@/config/seo";
import { mergeMeta } from "@/config/mergeMeta";

// ============================================================
// 首页 —— 导购版式：KV 轮播 + 分类入口 + 标签位商品 + 标签位文章。
//
// 改版前首页是 IndexBanner + IndexProductList（按分类分组的 shop all），
// 那套「列全部商品」的版式语义上属于商品列表页，已整体搬到 /product（见 ./product/page.jsx）。
// 首页改为「先分流、再推荐」：让用户按分类/热卖/内容进站，而不是一上来面对全量商品墙。
//
// 运营可改、不需要发版的两处（改完去发布页点一次「发布」重建即可）：
//   - 热卖位：后台「商品标签」建 BEST_SELLERS_TAG 这个 key 的标签，给商品打标即上位；
//   - 文章位：后台「博客标签」建 HOME_BLOG_TAG 这个 key 的标签，给文章打标即上位。
// 两者都是「标签不存在 / 没打标 → 下发空数组 → 模块整块隐藏」，不会留下空壳区块。
// ============================================================

// 首页热卖位的商品来源标签 key（后台「商品标签」里建同名标签并给商品打标）。
const BEST_SELLERS_TAG = "best-sellers";

// 首页文章位的文章来源标签 key（后台「博客标签」里建同名标签并给文章打标）。
const HOME_BLOG_TAG = "index-blog";

// 首页文章位展示条数（打标超过这个数时后端按 weight 降序取前 N 篇）。
const HOME_BLOG_COUNT = 3;

// 首页数据层，构建期一次 Promise.all 取全 —— 纯 SSG，靠「发布」重建：
//   - LANG     ← /config/getLanguageByNamespace（含各模块标题所在的 home.* 命名空间）
//   - CONFIG   ← /config/getPageConfigByNamespace（home.banner / common.base）
//   - 分类     ← getSortList（读 enabled=1 全量分类，不依赖是否已上架商品，空店也有分类可展示）
//   - 热卖位   ← getTagProducts（按 best-sellers 标签取 Top 10）
//   - 文章位   ← getTagBlogs（按 index-blog 标签取 Top 3 文章卡，不含正文）
//
// 已不再取 getRemoteProductList：全量商品列表只有 IndexProductList / IndexProductLdJson 用，
// 两者都随版式搬到了 /product，首页留着等于每次构建白拉一份全站商品（该接口是全语言全关联的大响应）。
//
// 不读 area cookie → 整页可静态化；热卖位价格由客户端按 area 调 /api/products-offer 补齐。
async function getData({ locale }) {
  const [LANG, CONFIG, categoryList, bestSellersData, blogTagData] =
    await Promise.all([
      getRemoteLanguage({
        locale,
        nameSpace: [
          "home",
          "common.advantage",
          "home.title",
          "home.description",
          "home.keywords",
          "home.category"
        ]
      }),
      getRemoteConfig({ locale, nameSpace: ["home.banner", "common.base"] }),
      getSortList({ locale }),
      getTagProducts({ locale, tagKey: BEST_SELLERS_TAG, limit: 10 }),
      getTagBlogs({ locale, tagKey: HOME_BLOG_TAG, limit: HOME_BLOG_COUNT })
    ]);

  return {
    LANG,
    CONFIG,
    categoryList,
    // 标签不存在 / 接口失败 → null → 下发空数组，BestSellersModule 自行隐藏
    bestSellers: bestSellersData?.goodList || [],
    bestSellersTag: bestSellersData?.tag || null,
    // 同上：没打标 → 空数组 → BlogModule 自行隐藏
    blogList: blogTagData?.blogList || []
  };
}

export async function generateMetadata({ params }) {
  const { locale } = await params;
  const { LANG, CONFIG } = await getData({ locale });
  return mergeMeta(
    {
      title: `${CONFIG["common.base"]?.company_name} - ${LANG["home.title"]}`,
      description: LANG["home.description"],
      keywords: LANG["home.keywords"],
      alternates: buildAlternates("/", locale)
    },
    "/"
  );
}

export default async function Home({ params }) {
  const { locale } = await params;
  const { CONFIG, LANG, categoryList, bestSellers, bestSellersTag, blogList } =
    await getData({ locale });

  return (
    <main>
      <IndexContext
        CONFIG={CONFIG}
        LANG={LANG}
        categoryList={categoryList}
        bestSellers={bestSellers}
        bestSellersTag={bestSellersTag}
        blogList={blogList}
        locale={locale}
      >
        {/* 首屏 KV 轮播（banner 为空时组件内部渲染空轨道，不报错） */}
        <IndexBanner />
        {/* 分类入口：横向滑动分类卡，数据来自后台分类配置（无分类则整块隐藏） */}
        <CategoryModule />
        {/* 热卖位：商品来自后台「best-sellers」标签（见 BEST_SELLERS_TAG），没打标则整块隐藏 */}
        <BestSellersModule />
        {/* 文章位：文章来自后台「index-blog」标签（见 HOME_BLOG_TAG），没打标则整块隐藏 */}
        <BlogModule />
      </IndexContext>
      {/* 商品 JSON-LD 不再在首页输出：首页已不展示商品列表，结构化数据须与页面可见内容一致，
          逐商品 Product/Offer 改由 /product 页输出（见 ./product/page.jsx）。 */}
    </main>
  );
}
