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

// LANGUAGE过滤
const filterLanguage = function ({ localeLanguage, languageNameSpace }) {
  const languageObj = {};
  languageNameSpace.forEach((nameSpace) => {
    Object.keys(localeLanguage).forEach((key) => {
      if (key.startsWith(nameSpace) && !languageObj[key]) {
        languageObj[key] = localeLanguage[key];
      }
    });
  });
  return languageObj;
};

export default async function getLanguageList({
  locale,
  configList,
  languageNameSpace,
}) {
  if (!configList.includes("language")) return null;
  const localeLanguage = languageList[locale];
  return filterLanguage({ localeLanguage, languageNameSpace });
}
