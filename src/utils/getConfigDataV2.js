import getGoodList from "@/utils/getGoodList";
import getConfigList from "@/utils/getConfigList";
import getLanguageList from "@/utils/getLanguageList";
import getGoodSortList from "@/utils/getGoodSortList";
import getGoodDiscountList from "@/utils/getGoodDiscountList";

/**
 * 获取所有配置数据
 */
const getConfig = async function ({ locale, configList }) {
  const promiseList = [];
  const result = {};
  if (configList.includes("config")) {
    promiseList.push(getConfigList(locale));
    result.CONFIG = null;
  }
  if (configList.includes("language")) {
    promiseList.push(getLanguageList(locale));
    result.LANG = null;
  }
  if (configList.includes("goodSort")) {
    promiseList.push(getGoodSortList(locale));
    result.GOODSORTLIST = null;
  }
  if (configList.includes("good")) {
    promiseList.push(getGoodList(locale));
    result.GOODLIST = null;
  }
  if (configList.includes("goodDiscountFestival")) {
    promiseList.push(getGoodDiscountList(locale));
    result.GOODDISCOUNTFESTIVAL = null;
  }

  const resList = await Promise.all(promiseList);

  for (let i = 0; i < resList.length; i++) {
    const res = resList[i];
    const key = Object.keys(result)[i];
    result[key] = res;
  }
  return result;
};
/**
 * 过滤商品分类数据
 */
const filterGoodSort = async function ({ result, area }) {
  return result.GOODSORTLIST.map(({ goodList, ...goodSort }) => {
    // 遍历商品
    goodList = goodList.map(({ comboList, ...good }) => {
      // 遍历商品套餐
      comboList = comboList.map(({ areaList, ...combo }) => {
        // 遍历商品套餐区域, 找到对应的国家列表
        let areaInfo = null;
        areaList.forEach((areaItem) => {
          if (areaItem.country_code === area) {
            areaInfo = areaItem;
          }
        });
        return {
          areaInfo,
          ...combo,
        };
      });
      return {
        comboList,
        ...good,
      };
    });
    return {
      goodList,
      ...goodSort,
    };
  });
};

/**
 * 过滤商品数据
 */
const filterGood = async function ({ result, area }) {
  return result.GOODLIST.map(({ comboList, ...good }) => {
    // 遍历商品套餐
    comboList = comboList.map(({ areaList, ...combo }) => {
      // 遍历商品套餐区域, 找到对应的国家列表
      let areaInfo = null;
      areaList.forEach((areaItem) => {
        if (areaItem.country_code === area) {
          areaInfo = areaItem;
        }
      });
      return {
        areaInfo,
        ...combo,
      };
    });
    return { comboList, ...good };
  });
};

/**
 * 语言过滤
 */
const filterLanguage = async function ({ result, languageNameSpace }) {
  const languageObj = {};
  languageNameSpace.forEach((nameSpace) => {
    Object.keys(result.LANG).forEach((key) => {
      if (key.startsWith(nameSpace) && !languageObj[key]) {
        languageObj[key] = result.LANG[key];
      }
    });
  });
  return languageObj;
};

export default async function getConfigDataV2({
  locale,
  area,
  configList,
  languageNameSpace,
}) {
  // 获取所有配置数据
  const result = await getConfig({ locale, configList });
  /**
   * 商品分类 - 简化数据（去掉areaList）
   */
  if (result.GOODSORTLIST) {
    result.GOODSORTLIST = await filterGoodSort({ result, area });
  }
  /**
   * 商品 - 简化数据（去掉areaList）
   */
  if (result.GOODLIST) {
    result.GOODLIST = await filterGood({ result, area });
  }
  /**
   * 过滤语言包
   */
  if (result.LANG && languageNameSpace) {
    result.LANG = await filterLanguage({ result, languageNameSpace });
  }
  return result;
}
