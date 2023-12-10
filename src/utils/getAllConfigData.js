import getGoodList from "@/utils/getGoodList";
import getConfigList from "@/utils/getConfigList";
import getLanguageList from "@/utils/getLanguageList";
import getGoodSortList from "@/utils/getGoodSortList";
import getGoodDiscountList from "@/utils/getGoodDiscountList";

export default async function getAllConfigData(locale) {
  const [CONFIG, LANG, GOODSORTLIST, GOODLIST, GOODDISCOUNTFESTIVAL] =
    await Promise.all([
      getConfigList(locale),
      getLanguageList(locale),
      getGoodSortList(locale),
      getGoodList(locale),
      getGoodDiscountList(locale),
    ]);
  return {
    CONFIG,
    LANG,
    GOODSORTLIST,
    GOODLIST,
    GOODDISCOUNTFESTIVAL,
  };
}
