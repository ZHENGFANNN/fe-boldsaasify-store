/** @format */

const cn = require("@@/locale/languageList/cn.json");
const de = require("@@/locale/languageList/de.json");
const en = require("@@/locale/languageList/en.json");
const es = require("@@/locale/languageList/es.json");
const fr = require("@@/locale/languageList/fr.json");
const hk = require("@@/locale/languageList/hk.json");
const it = require("@@/locale/languageList/it.json");
const ja = require("@@/locale/languageList/ja.json");
const ko = require("@@/locale/languageList/ko.json");
const ru = require("@@/locale/languageList/ru.json");

const languageList = {
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

export default async function getLanguageList(lang) {
  const data = languageList[lang];
  return data;
}
