import Advantage from "../components/Layout/Advantage";
import getRemoteLanguage from "@/config/Api/getRemoteLanguage";
import getRemoteConfig from "@/config/Api/getRemoteConfig";
import getRemoteProductList from "@/config/Api/getRemoteProductList";

import IndexProductList from "./components/IndexProductList";
import IndexProductLdJson from "./components/IndexProductLdJson";
import IndexBanner from "./components/IndexBanner";
import IndexContext from "./components/IndexContext";

import { buildAlternates } from "@/config/seo";

// 多语言/页面配置/产品列表各走独立远程接口（后端整形 + TTL，前端开箱即用）：
//   - LANG    ← /config/getLanguageByNamespace
//   - CONFIG  ← /config/getPageConfigByNamespace（home.banner / common.base）
//   - 产品列表 ← getRemoteProductList（comboList 仅含 key + associate_country_key，
//               价格由客户端 IndexProductList 按 area cookie 调 /api/products-pricing 批量取齐）
// 不读 area cookie → 首页整页可静态化（SSG）；JSON-LD 走 IndexProductLdJson server 子组件以 us 兜底。
async function getData({ locale }) {
  const [LANG, CONFIG, goodSortList] = await Promise.all([
    getRemoteLanguage({
      locale,
      nameSpace: [
        "store.index",
        "common.advantage",
        "store.index.title",
        "store.index.description",
        "store.index.keywords"
      ]
    }),
    getRemoteConfig({ locale, nameSpace: ["home.banner", "common.base"] }),
    getRemoteProductList({ locale })
  ]);

  return { LANG, CONFIG, goodSortList };
}

export async function generateMetadata({ params }) {
  const { locale } = await params;
  const { LANG, CONFIG } = await getData({ locale });
  return {
    title: `${CONFIG["common.base"]?.company_name} - ${LANG["store.index.title"]}`,
    description: LANG["store.index.description"],
    keywords: LANG["store.index.keywords"],
    alternates: buildAlternates("/", locale)
  };
}

export default async function Home({ params }) {
  const { locale } = await params;
  const { CONFIG, LANG, goodSortList } = await getData({ locale });

  return (
    <main>
      <IndexContext
        CONFIG={CONFIG}
        LANG={LANG}
        goodSortList={goodSortList}
        locale={locale}
      >
        <IndexBanner />
        <IndexProductList />
        <Advantage LANG={LANG} />
      </IndexContext>
      {/* JSON-LD 走 server 子组件（爬虫不执行 JS），SSG 阶段以默认 us 价兜底。 */}
      <IndexProductLdJson
        goodSortList={goodSortList}
        locale={locale}
        companyName={CONFIG["common.base"]?.company_name}
      />
    </main>
  );
}
