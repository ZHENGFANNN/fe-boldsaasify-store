import Advantage from "../components/Layout/Advantage";
import getConfigData from "../utils/getConfigData";

import IndexProductList from "./components/IndexProductList";
import IndexBanner from "./components/IndexBanner";
import IndexContext from "./components/IndexContext";

import { buildAlternates } from "@/config/seo";
import { cookies } from "next/headers";

async function getData({ locale, area }) {
  const result = await getConfigData({
    locale,
    area,
    configList: ["config", "language", "product"],
    productNameSpace: ["sort"],
    languageNameSpace: [
      "store.index",
      "common.advantage",
      "store.index.title",
      "store.index.description",
      "store.index.keywords"
    ],
    configNameSpace: ["home.banner", "common.base"]
  });

  result.PRODUCT.sort = result.PRODUCT.sort.map(({ goodList, ...item }) => {
    return {
      ...item,
      goodList: goodList.map(({ comboList, ...good }) => {
        return {
          areaInfo: comboList[0].areaInfo,
          ...good
        };
      })
    };
  });

  return result;
}

export async function generateMetadata({ params }) {
  const { locale } = await params;
  const { LANG, CONFIG } = await getData({
    locale,
    area: "us"
  });
  return {
    title: `${CONFIG["common.base"]?.company_name} - ${LANG["store.index.title"]}`,
    description: LANG["store.index.description"],
    keywords: LANG["store.index.keywords"],
    alternates: buildAlternates("/", locale)
  };
}

async function HomeContent({ locale }) {
  const cookieStore = await cookies();
  const area = cookieStore.get("area")?.value || "us";
  const { CONFIG, LANG, PRODUCT } = await getData({
    locale,
    area
  });

  return (
    <main>
      <IndexContext
        CONFIG={CONFIG}
        LANG={LANG}
        // goodDiscountFestival={GOODDISCOUNTFESTIVAL}
        goodSortList={PRODUCT.sort}
        locale={locale}
        area={area}
      >
        <IndexBanner />
        <IndexProductList />
        <Advantage LANG={LANG} />
      </IndexContext>
    </main>
  );
}

export default async function Home({ params }) {
  const { locale } = await params;
  return <HomeContent locale={locale} />;
}
