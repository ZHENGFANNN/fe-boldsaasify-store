import Advantage from "../../components/Layout/Advantage";
import getRemoteLanguage from "@/config/Api/getRemoteLanguage";
import getRemoteConfig from "@/config/Api/getRemoteConfig";
import getRemoteProductList from "@/config/Api/getRemoteProductList";

import IndexContext from "../components/IndexContext";
import IndexSale from "../components/IndexSale";

import { buildAlternates } from "@/config/seo";

// Sale 落地页 /[locale]/sale：与首页共用 IndexContext + 远程数据源，仅显示折扣商品。
//
// 不限商品数量（IndexSale limit=Infinity），用户可在此一站浏览所有当前促销商品。
// 与首页一样为 SSG（不读 area cookie），价格客户端动态取（按 area）。
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
    getRemoteConfig({ locale, nameSpace: ["common.base"] }),
    getRemoteProductList({ locale })
  ]);
  return { LANG, CONFIG, goodSortList };
}

export async function generateMetadata({ params }) {
  const { locale } = await params;
  const { LANG, CONFIG } = await getData({ locale });
  return {
    title: `${LANG?.["store.sale.title"] || "Sale"} - ${CONFIG["common.base"]?.company_name || ""}`,
    description:
      LANG?.["store.sale.description"] ||
      "Discover our latest sale items — discounted prices on lab-grown diamond engagement rings, wedding bands and fine jewelry.",
    alternates: buildAlternates("/sale", locale)
  };
}

export default async function SalePage({ params }) {
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
        <IndexSale
          limit={Infinity}
          title={LANG?.["store.sale.title"] || "Sale"}
        />
        <Advantage LANG={LANG} />
      </IndexContext>
    </main>
  );
}
