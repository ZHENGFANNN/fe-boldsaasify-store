/** @format */

import getGoodList from "@/utils/getConfigData/getGoodList";
import getConfigList from "@/utils/getConfigData/getConfigList";
import getLanguageList from "@/utils/getConfigData/getLanguageList";
import getGoodSortList from "@/utils/getConfigData/getGoodSortList";
import getGoodDiscountList from "@/utils/getConfigData/getGoodDiscountList";
import getBlogData from "@/utils/getConfigData/getBlogData";

/**
 * 获取所有配置数据
 */
const getAllConfig = async function ({ locale, configList }) {
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
  if (configList.includes("blog")) {
    promiseList.push(await getBlogData(locale));
    result.BLOG = null;
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
 * LANGUAGE过滤
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

/**
 * CONFIG过滤
 */
const filterConfig = async function ({ result, configNameSpace }) {
  const configObj = {};
  configNameSpace.forEach((nameSpace) => {
    Object.keys(result.CONFIG).forEach((key) => {
      if (key.startsWith(nameSpace) && !configObj[key]) {
        configObj[key] = result.CONFIG[key];
      }
    });
  });
  return configObj;
};

export default async function getConfigData({
  locale,
  area,
  configList,
  languageNameSpace,
  configNameSpace,
}) {
  const startTIme = Date.now();
  // 获取所有配置数据
  const result = await getAllConfig({ locale, configList });
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

  /**
   * 过滤配置包
   */
  if (result.CONFIG && configNameSpace) {
    result.CONFIG = await filterConfig({ result, configNameSpace });
  }
  console.log(`---获取CONFIG时间: ${Date.now() - startTIme}---`);
  return result;
}
