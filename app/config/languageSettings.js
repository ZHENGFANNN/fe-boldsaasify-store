/** @format */

const globalConfig = require("@@/fetch-data/globalConfig/index.json");

const toLocale = (isoCode) => String(isoCode || "").toLowerCase();

const getSettingLanguages = () =>
  (globalConfig["setting.language"] ?? []).filter(
    (item) => item.enabled !== false
  );

const buildLanguageSettings = () => {
  const settings = getSettingLanguages();
  const languageList = settings.map((item) => {
    const value = toLocale(item.iso_code);
    return {
      value,
      label: item.endonym_name || item.name || value,
      iso_code: item.iso_code,
      root_url: item.root_url,
      primary: Boolean(item.primary)
    };
  });

  const languageMap = {};
  languageList.forEach((item) => {
    languageMap[item.value] = item;
  });

  const locales = languageList.map((item) => item.value);
  const primaryItem = settings.find((item) => item.primary) || settings[0];
  const defaultLocale = primaryItem
    ? toLocale(primaryItem.iso_code)
    : locales[0] || "en";

  return {
    languageList,
    languageMap,
    locales: locales.length ? locales : ["en"],
    defaultLocale
  };
};

const settings = buildLanguageSettings();

const resolveLocale = (locale) => {
  const normalized = toLocale(locale);
  return settings.locales.includes(normalized)
    ? normalized
    : settings.defaultLocale;
};

module.exports = {
  ...settings,
  getSettingLanguages,
  toLocale,
  resolveLocale
};
