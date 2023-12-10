import productDiscount from "@@/locale/productDiscount/festival";

function filterData(data) {
  const currentTime = Date.now();
  for (let i = 0; i < data.length; i++) {
    const item = data[i];
    const startTime = item.start_time;
    const endTime = item.end_time;
    console.log(
      "startTime <= currentTime && endTime >= currentTime",
      endTime,
      i
    );

    if (startTime <= currentTime && endTime >= currentTime) {
      return item;
    }
  }
  return null; // 如果没有满足条件的对象，则返回 null
}

export default async function getGoodDiscountList(lang) {
  try {
    if (Array.isArray(productDiscount)) {
      const discount = filterData(productDiscount);
      if (discount) {
        const { languages, ...values } = discount;
        return {
          ...values,
          title: languages[lang] || languages["en"],
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
