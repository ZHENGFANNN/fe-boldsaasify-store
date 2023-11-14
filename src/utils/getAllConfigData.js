import getGoodList from "@/utils/getGoodList";
import getConfigList from "@/utils/getConfigList";
import getLanguageList from "@/utils/getLanguageList";
import getGoodSortList from "@/utils/getGoodSortList";

export default async function (locale) {
  const [CONFIG, LANG, GOODSORTLIST, GOODLIST] = await Promise.all([
    getConfigList(locale),
    getLanguageList(locale),
    getGoodSortList(locale),
    getGoodList(locale),
  ]);
  return {
    CONFIG,
    LANG,
    GOODSORTLIST,
    GOODLIST,
  };
}
