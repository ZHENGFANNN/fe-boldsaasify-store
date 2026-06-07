/** @format */

const globalConfig = require("@@/fetch-data/globalConfig/index.json");
const { defaultLocale, toLocale } = require("@@/app/config/languageSettings");

const enabledLocales = (globalConfig["setting.language"] ?? [])
  .filter((item) => item.enabled !== false)
  .map((item) => toLocale(item.iso_code));

const pageConfigDataList = Object.fromEntries(
  enabledLocales.map((locale) => [
    locale,
    require(`@@/fetch-data/pageConfig/${locale}.json`),
  ])
);

const filterConfig = ({ merged, configNameSpace }) => {
  const configObj = {};
  configNameSpace.forEach((nameSpace) => {
    Object.keys(merged).forEach((key) => {
      if (key === nameSpace || key.startsWith(`${nameSpace}.`)) {
        configObj[key] = merged[key];
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
  const pageConfig =
    pageConfigDataList[locale] || pageConfigDataList[defaultLocale];
  const merged = { ...pageConfig, ...globalConfig };
  return filterConfig({ merged, configNameSpace });
}
