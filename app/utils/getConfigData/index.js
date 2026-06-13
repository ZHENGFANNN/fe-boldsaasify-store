import getConfigList from "./getConfigList";
import getLanguageList from "./getLanguageList";
import getProductData from "@/config/Api/getProductData";
import getBlogData from "@/config/Api/getBlogData";

// 传统 ISR：本函数不再用 'use cache'（已移除 cacheComponents）。
// 缓存语义下沉到各 fetch 的 next:{tags,revalidate}（见 getProductData/getBlogData）；
// 读本地物化 JSON 的 getConfigList/getLanguageList 本就是构建期静态数据。
export default async function getConfigData({
  locale,
  configList = [],
  configNameSpace = [],
  languageNameSpace = [],
  blogNameSpace = [],
  productNameSpace = []
}) {
  const [CONFIG, LANG, BLOG, PRODUCT] = await Promise.all([
    getConfigList({ locale, configList, configNameSpace }),
    getLanguageList({ locale, configList, languageNameSpace }),
    getBlogData({ locale, configList, blogNameSpace }),
    getProductData({ locale, configList, productNameSpace })
  ]);
  return {
    CONFIG,
    LANG,
    BLOG,
    PRODUCT
  };
}
