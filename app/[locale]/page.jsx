import getRemoteLanguage from "@/config/Api/getRemoteLanguage";
import getRemoteConfig from "@/config/Api/getRemoteConfig";
import getRemoteProductList from "@/config/Api/getRemoteProductList";
import getSortList from "@/config/Api/getSortList";
import getTagProducts from "@/config/Api/getTagProducts";
import getTagBlogs from "@/config/Api/getTagBlogs";

import IndexContext from "./components/IndexContext";
import IndexBanner from "./components/IndexBanner";
import TrustBar from "./components/TrustBar";
import CategoryModule from "./components/CategoryModule";
import BestSellersModule from "./components/BestSellersModule";
import IndexDiamondShapes from "./components/IndexDiamondShapes";
import FeatureShowcase from "./components/FeatureShowcase";
import IndexProductList from "./components/IndexProductList";
import ReviewsModule from "./components/ReviewsModule";
import BlogModule from "./components/BlogModule";
import IndexProductLdJson from "./components/IndexProductLdJson";

import { buildAlternates } from "@/config/seo";
import { mergeMeta } from "@/config/mergeMeta";

// 首页 Best Sellers 位的商品来源：后台「商品标签」建这个 key 的标签并给商品打标即可，
// 换商品不需要发版（改完打标去发布页点发布重建即可）。标签不存在 → 模块自动隐藏。
const BEST_SELLERS_TAG = "best-sellers";

// 首页 Stories & Guides 位的文章来源：后台「博客标签」建这个 key 的标签并给文章打标即可，
// 换文章不需要发版（同样改完去发布页点发布重建）。标签不存在/没打标 → 模块自动隐藏。
const HOME_BLOG_TAG = "index-blog";

// 首页博客位展示条数（后台打标超过这个数时取 weight 最高的前 N 篇）。
const HOME_BLOG_COUNT = 3;

// 首页数据层（后端整形 + TTL，前端开箱即用），构建期一次 Promise.all 取全 —— 纯 SSG：
//   - LANG      ← /config/getLanguageByNamespace（home + home.category 文案命名空间）
//   - CONFIG    ← /config/getPageConfigByNamespace（home.banner / common.base）
//   - 产品列表  ← getRemoteProductList（comboList 仅含 key + associate_country_key，
//                价格/折扣由客户端 IndexProductList 按 area cookie 调 /api/products-offer 批量取齐）
//   - 热卖位    ← getTagProducts（按 best-sellers 标签取 Top 10，同样不含价格）
//   - 博客位    ← getTagBlogs（按 index-blog 标签取 Top 3 文章卡，不含正文）
// 不读 area cookie → 首页整页可 SSG；JSON-LD 走 IndexProductLdJson server 子组件以 us 兜底。
async function getData({ locale }) {
  const [LANG, CONFIG, goodsSortList, categoryList, bestSellersData, blogTagData] =
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
      getRemoteProductList({ locale }),
      getSortList({ locale }),
      getTagProducts({ locale, tagKey: BEST_SELLERS_TAG, limit: 10 }),
      getTagBlogs({ locale, tagKey: HOME_BLOG_TAG, limit: HOME_BLOG_COUNT })
    ]);

  return {
    LANG,
    CONFIG,
    goodsSortList,
    categoryList,
    // 标签不存在/接口失败 → null → 下发空数组，BestSellersModule 自行隐藏
    bestSellers: bestSellersData?.goodList || [],
    bestSellersTag: bestSellersData?.tag || null,
    // 同上：标签不存在/没打标 → 空数组 → BlogModule 自行隐藏（不再退回 mock 假文章）
    blogList: blogTagData?.blogList || []
  };
}

// 「为什么选培育钻」图文交替 mock（无图走 tonal 占位；接后端后换真实图/文案）。
// 配图刻意「举证」而非展示商品（商品位已由 Category/BestSellers 承担，避免视觉重复）：
//   第一块讲光学性质无差别 → 裸石微距（火彩/色散可见），冷调呼应 tonal 占位色；
//   第二块讲来路而非成品 → 实验室原石 + CVD 生长舱，暖调。
// 图存 R2 public/home/why-lab-grown/*.jpg；换图后同名覆盖需给 URL 递增 ?v=N 绕 CF immutable 缓存。
const WHY_LAB_GROWN = [
  {
    eyebrow: "Why Lab-Grown",
    title: "Identical to Mined, Better in Every Way",
    desc: "Lab-grown diamonds share the exact chemical, physical, and optical properties of mined diamonds — the same fire and brilliance, graded by the same IGI and GIA standards. The only difference is how they're made.",
    image: "https://asset.boldradiant.com/public/home/why-lab-grown/identical.jpg?v=1",
    cta_text: "Explore Diamonds",
    cta_href: "/product",
  },
  {
    eyebrow: "Conscious by Design",
    title: "Ethically Created, Sustainably Sourced",
    desc: "Grown in a lab, not the earth — no mining, no conflict, and a fraction of the environmental footprint. Beautiful jewelry you can feel good about, at a price that leaves room for the moments that matter.",
    image: "https://asset.boldradiant.com/public/home/why-lab-grown/ethical.jpg?v=1",
    cta_text: "Our Promise",
    cta_href: "/blog",
  },
];

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
  const { CONFIG, LANG, goodsSortList, categoryList, bestSellers, bestSellersTag, blogList } =
    await getData({ locale });

  return (
    <main>
      <IndexContext
        CONFIG={CONFIG}
        LANG={LANG}
        goodsSortList={goodsSortList}
        categoryList={categoryList}
        bestSellers={bestSellers}
        bestSellersTag={bestSellersTag}
        blogList={blogList}
        locale={locale}
      >
        {/* 首屏 KV 轮播（banner 为空时组件内部渲染空轨道，不报错） */}
        <IndexBanner />
        {/* 信任/价值主张条：免运费 / 终身质保 / 30 天退换 / IGI·GIA 认证（mock，可后台化） */}
        <TrustBar />
        {/* Shop Jewelry by Category：横向滑动分类卡（参考 brilliantearth 版式，空店走 8 分类兜底） */}
        <CategoryModule />
        {/* 当前热卖：商品来自后台「best-sellers」标签（见 BEST_SELLERS_TAG），标签为空则整块隐藏 */}
        <BestSellersModule />
        {/* 按形状选购钻石（旗舰站特色，纯 SSG） */}
        <IndexDiamondShapes />
        {/* 为什么选培育钻：图文交替品牌故事（mock list，无图走占位） */}
        <FeatureShowcase list={WHY_LAB_GROWN} />
        {/* 精选商品分类网格（复用现有卡片 + 客户端取价）：0 商品时各类 goodList 为空、不渲染 */}
        {/* <IndexProductList /> */}
        {/* 客户评价聚合：总均分 + 精选评价卡（mock，接后端后由 props 下发） */}
        <ReviewsModule LANG={LANG} />
        {/* From the Journal：文章来自后台「博客标签」index-blog（见 HOME_BLOG_TAG），没打标则整块隐藏 */}
        <BlogModule />
      </IndexContext>
      {/* JSON-LD 走 server 子组件（爬虫不执行 JS），SSG 阶段以默认 us 价兜底。 */}
      <IndexProductLdJson
        goodsSortList={goodsSortList}
        locale={locale}
        companyName={CONFIG["common.base"]?.company_name}
      />
    </main>
  );
}
