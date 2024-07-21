const cn = require("@@/locale/productSort/cn.json");
const de = require("@@/locale/productSort/de.json");
const en = require("@@/locale/productSort/en.json");
const es = require("@@/locale/productSort/es.json");
const fr = require("@@/locale/productSort/fr.json");
const hk = require("@@/locale/productSort/hk.json");
const it = require("@@/locale/productSort/it.json");
const ja = require("@@/locale/productSort/ja.json");
const ko = require("@@/locale/productSort/ko.json");
const ru = require("@@/locale/productSort/ru.json");

const productSortList = {
  cn,
  de,
  en,
  es,
  fr,
  hk,
  it,
  ja,
  ko,
  ru,
};

export default async function getGoodSortList(lang) {
  return productSortList[lang];
}
