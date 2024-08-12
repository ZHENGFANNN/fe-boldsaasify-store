/** @format */

// const cn = require("@@/locale/productList/cn.json");
// const de = require("@@/locale/productList/de.json");
// const en = require("@@/locale/productList/en.json");
// const es = require("@@/locale/productList/es.json");
// const fr = require("@@/locale/productList/fr.json");
// const hk = require("@@/locale/productList/hk.json");
// const it = require("@@/locale/productList/it.json");
// const ja = require("@@/locale/productList/ja.json");
// const ko = require("@@/locale/productList/ko.json");
// const ru = require("@@/locale/productList/ru.json");

// const productInfoList = {
//   cn,
//   de,
//   en,
//   es,
//   fr,
//   hk,
//   it,
//   ja,
//   ko,
//   ru,
// };

export default async function getGoodList(lang) {
  const startTime = new Date();
  const { default: productInfo } = await import(
    "@@/locale/productList/" + lang + ".json"
  );
  const endTime = new Date();
  console.log(`getGoodList ${lang} time: ${endTime - startTime}`);
  return productInfo;
}
