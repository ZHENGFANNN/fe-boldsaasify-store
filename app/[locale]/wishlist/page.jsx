// 我的收藏 / 愿望清单 /[locale]/wishlist
//
// Server component：取多语言 + 全量商品目录（getRemoteProductList，与首页同源 product:list）。
// 收藏项（sortKey/productKey）由客户端 useWishlist store 持有（游客本地 / 登录后端），
// 在 WishlistClient 里按 (sort_key, key) 映射出标题/图，价格沿用 getProductsPricing 客户端批量取。
//
// 该页是「我的」私有页，不需要 SEO 索引；仍出基础 metadata + alternates 保持站内一致。

import getRemoteLanguage from "@/config/Api/getRemoteLanguage";
import getRemoteConfig from "@/config/Api/getRemoteConfig";
import getRemoteProductList from "@/config/Api/getRemoteProductList";
import { buildAlternates } from "@/config/seo";

import WishlistClient from "./components/WishlistClient";

async function getData({ locale }) {
  const [LANG, CONFIG, goodsSortList] = await Promise.all([
    getRemoteLanguage({
      locale,
      nameSpace: ["store.wishlist", "store.index", "common.nav", "common.base"]
    }),
    getRemoteConfig({ locale, nameSpace: ["common.base"] }),
    getRemoteProductList({ locale })
  ]);
  return { LANG, CONFIG, goodsSortList };
}

export async function generateMetadata({ params }) {
  const { locale } = await params;
  const { LANG, CONFIG } = await getData({ locale });
  const company = CONFIG?.["common.base"]?.company_name || "";
  const title = LANG?.["store.wishlist.meta_title"] || "My Wishlist";
  return {
    title: company ? `${title} - ${company}` : title,
    description:
      LANG?.["store.wishlist.meta_description"] ||
      "Your saved engagement rings and jewelry — keep track of the pieces you love and come back to them anytime.",
    robots: { index: false, follow: true },
    alternates: buildAlternates("/wishlist", locale)
  };
}

// 把全量分类目录拍平成 { "sortKey:productKey": product } 映射，供客户端按收藏键查商品。
function flattenCatalog(goodsSortList) {
  const map = {};
  (goodsSortList || []).forEach((sort) => {
    (sort.goodList || []).forEach((p) => {
      if (p.sort_key && p.key) {
        map[`${p.sort_key}:${p.key}`] = p;
      }
    });
  });
  return map;
}

export default async function WishlistPage({ params }) {
  const { locale } = await params;
  const { LANG, goodsSortList } = await getData({ locale });
  const catalog = flattenCatalog(goodsSortList);

  return <WishlistClient LANG={LANG} locale={locale} catalog={catalog} />;
}
