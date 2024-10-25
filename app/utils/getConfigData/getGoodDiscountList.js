/** @format */

import productDiscount from "@@/locale/productDiscount/festival";

function filterData(data) {
  const currentTime = Date.now();
  for (let i = 0; i < data.length; i++) {
    const item = data[i];
    const startTime = item.start_time;
    const endTime = item.end_time;
    const longActivity = item.long_activity;
    if (longActivity || (startTime <= currentTime && endTime >= currentTime)) {
      return item;
    }
  }
  return null; // 如果没有满足条件的对象，则返回 null
}

export default async function getGoodDiscountList({ locale, configList }) {
  if (!configList.includes("goodDiscountFestival")) null;
  try {
    if (Array.isArray(productDiscount)) {
      const festivalItem = filterData(productDiscount);
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
