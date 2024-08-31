/** @format */

import getConfigList from "@/utils/getConfigData/getConfigList";
import getLanguageList from "@/utils/getConfigData/getLanguageList";
import getGoodDiscountList from "@/utils/getConfigData/getGoodDiscountList";
import getProductData from "@/utils/getConfigData/getProductData";
import getBlogData from "@/utils/getConfigData/getBlogData";

export default async function getConfigData({
  locale,
  configList = [],
  configNameSpace = [],
  languageNameSpace = [],
  blogNameSpace = [],
  productNameSpace = [],
}) {
  const startTIme = Date.now();
  const [CONFIG, LANG, GOODDISCOUNTFESTIVAL, BLOG, PRODUCT] = await Promise.all(
    [
      getConfigList({ locale, configList, configNameSpace }),
      getLanguageList({ locale, configList, languageNameSpace }),
      getGoodDiscountList({ locale, configList }),
      getBlogData({ locale, configList, blogNameSpace }),
      getProductData({ locale, configList, productNameSpace }),
    ]
  );
  console.log(`---获取CONFIG时间: ${Date.now() - startTIme}---`);
  return {
    CONFIG,
    LANG,
    GOODDISCOUNTFESTIVAL,
    BLOG,
    PRODUCT,
  };
}
