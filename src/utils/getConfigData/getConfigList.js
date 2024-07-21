const cn = require("@@/locale/configList/cn.json");
const de = require("@@/locale/configList/de.json");
const en = require("@@/locale/configList/en.json");
const es = require("@@/locale/configList/es.json");
const fr = require("@@/locale/configList/fr.json");
const hk = require("@@/locale/configList/hk.json");
const it = require("@@/locale/configList/it.json");
const ja = require("@@/locale/configList/ja.json");
const ko = require("@@/locale/configList/ko.json");
const ru = require("@@/locale/configList/ru.json");

const configList = {
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

export default async function getConfigList(lang) {
  return configList[lang];
}
