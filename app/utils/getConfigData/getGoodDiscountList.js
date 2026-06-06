/** @format */

import productDiscount from "@@/locale/productDiscount/festival";

// 判断该折扣是否对当前访客所在国家(area=country_code)生效。
// enabled_countries 为空数组 / 缺失 / 非数组时表示对所有国家生效（向后兼容旧记录）。
function matchCountry(item, area) {
  const countries = item.enabled_countries;
  if (!Array.isArray(countries) || countries.length === 0) {
    return true;
  }
  return countries.includes(area);
}

function filterData(data, area) {
  const currentTime = Date.now();
  for (let i = 0; i < data.length; i++) {
    const item = data[i];
    const startTime = item.start_time;
    const endTime = item.end_time;
    const longActivity = item.long_activity;
    const inTime =
      longActivity || (startTime <= currentTime && endTime >= currentTime);
    if (inTime && matchCountry(item, area)) {
      return item;
    }
  }
  return null; // 如果没有满足条件的对象，则返回 null
}

export default async function getGoodDiscountList({ locale, area, configList }) {
  if (!configList.includes("goodDiscountFestival")) null;
  try {
    if (Array.isArray(productDiscount)) {
      const festivalItem = filterData(productDiscount, area);
      if (festivalItem) {
        const { languages, ...values } = festivalItem;
        return {
          ...values,
          title: languages[locale] || languages["en"],
        };
      } else {
        return null;
      }
    } else {
      return null;
    }
  } catch {
    return null;
  }
}
