/** @format */

import getRemoteLanguage from "@/config/Api/getRemoteLanguage";
import getRemoteConfig from "@/config/Api/getRemoteConfig";
import getCategoryProducts from "@/config/Api/getCategoryProducts";
import { buildAlternates } from "@/config/seo";
import { mergeMeta } from "@/config/mergeMeta";

import QuoteEstimator from "./components/QuoteEstimator";
import QuoteLdJson from "./components/QuoteLdJson";
import styles from "./page.module.scss";

// ============================================================
// /quote —— 珠宝估价器（Design & Price Your Ring）
//
// 存在的理由：本站只卖戒托，商详页明说中心石「priced and selected on its own」，
// 但站上此前没有任何地方能告诉顾客那颗石头大概多少钱。顾客要么去别处比价、
// 要么直接跳出。本页把「4C → 中心石行情价」和「戒托真实价」合成一个总预算。
//
// 数据与渲染口径：
//   - 中心石价：构建期烤进 JS 的行情表（@/config/diamondPricing），零请求、纯 SSG。
//   - 戒托价：**真实 SKU 价**，由客户端按 area cookie 调 /api/products-offer 取，
//     与首页 BestSellers / 分类页完全同一口径 —— 估价页给出的戒托价必须和
//     商详页一分不差，否则就是信任事故。
//   - 故本页服务端只取「戒托清单（名字/图/keys）」不取价，整页可 SSG。
//
// 戒托来源：engagement-rings 分类的全部上架商品（该分类即戒托线）。
// 分类为空/接口挂 → settings 为空数组 → 估价器降级为「只估中心石」，不报错。
// ============================================================

const SETTINGS_SORT_KEY = "engagement-rings";

async function getData({ locale }) {
  const [LANG, CONFIG, categoryData] = await Promise.all([
    getRemoteLanguage({
      locale,
      nameSpace: ["quote", "home", "common.base"],
    }),
    getRemoteConfig({ locale, nameSpace: ["common.base"] }),
    // 取戒托清单（不含价格，价格客户端按 area 取）
    getCategoryProducts({ locale, sortKey: SETTINGS_SORT_KEY }),
  ]);

  // getCategoryProducts 返回结构在不同实现下可能是 { goodList } 或数组，两种都兜住。
  const rawList = Array.isArray(categoryData)
    ? categoryData
    : categoryData?.goodList || categoryData?.list || [];

  const settings = rawList
    .filter((p) => p?.key && p?.sort_key)
    .map((p) => ({
      key: p.key,
      sort_key: p.sort_key,
      name: p.name || "",
      image: p.image || p.image_list?.[0]?.src || "",
    }));

  return { LANG, CONFIG, settings };
}

export async function generateMetadata({ params }) {
  const { locale } = await params;
  const { LANG, CONFIG } = await getData({ locale });
  const brand = CONFIG["common.base"]?.company_name || "";
  // LANG 未配置 quote.* 时全部走英文兜底（本站目前单语 en，加 key 是后续项）。
  const title =
    LANG["quote.title"] || "Lab-Grown Diamond & Ring Price Estimator";
  const description =
    LANG["quote.description"] ||
    "Estimate what your centre diamond will cost by shape, carat, colour, clarity and cut — then add a real setting price for a complete ring budget. Free, instant, no email required.";
  return mergeMeta(
    {
      title: brand ? `${brand} - ${title}` : title,
      description,
      keywords:
        LANG["quote.keywords"] ||
        "diamond price estimator, lab grown diamond price, engagement ring cost calculator, 4c diamond pricing",
      alternates: buildAlternates("/quote", locale),
    },
    "/quote"
  );
}

export default async function QuotePage({ params }) {
  const { locale } = await params;
  const { LANG, CONFIG, settings } = await getData({ locale });

  return (
    <main className={styles.page}>
      <QuoteEstimator LANG={LANG} locale={locale} settings={settings} />
      {/* JSON-LD 走 server 子组件（爬虫不执行 JS） */}
      <QuoteLdJson
        locale={locale}
        LANG={LANG}
        companyName={CONFIG["common.base"]?.company_name}
      />
    </main>
  );
}
