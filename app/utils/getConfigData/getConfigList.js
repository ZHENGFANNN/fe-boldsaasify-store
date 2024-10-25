/** @format */

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

const configDataList = {
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

const filterConfig = async function ({ localeConfig, configNameSpace }) {
  const configObj = {};
  configNameSpace.forEach((nameSpace) => {
    Object.keys(localeConfig).forEach((key) => {
      if (key.startsWith(nameSpace) && !configObj[key]) {
        configObj[key] = localeConfig[key];
      }
    });
  });
  return configObj;
};

export default async function getConfigList({
  locale,
  configList,
  configNameSpace,
}) {
  if (!configList.includes("config")) return null;
  const localeConfig = configDataList[locale];
  return filterConfig({ localeConfig, configNameSpace });
}
