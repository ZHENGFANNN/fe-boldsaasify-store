/** @format */

// 构建期时序容错：首次 CI 构建时 globalConfig/index.json 由 fetch-config 写入，
// 在其生成前本模块（被 middleware import）若直接 require 会 MODULE_NOT_FOUND 致编译失败。
// 与 languageSettings.ts 的 loadGlobalConfig 一致，缺失时退回空配置（markets=[]、defaultArea=us）。
const loadGlobalConfig = () => {
  try {
    return require("../../fetch-data/globalConfig/index.json");
  } catch {
    return {};
  }
};

const globalConfig = loadGlobalConfig();

const getSettingMarkets = () =>
  (globalConfig["setting.markets"] ?? []).filter((item) => item.enabled);

const getCountryName = (code, locale) => {
  try {
    return new Intl.DisplayNames([locale], { type: "region" }).of(
      String(code).toUpperCase()
    );
  } catch {
    return String(code).toUpperCase();
  }
};

const buildCountryData = (markets) => {
  const countryMap = {};
  const countryList = [];

  markets.forEach((market) => {
    (market.countries || []).forEach((code) => {
      const country_code = String(code).toLowerCase();
      if (countryMap[country_code]) return;

      const upperCode = String(code).toUpperCase();
      const countryItem = {
        country_code,
        continent_code: "",
        country: getCountryName(upperCode, "en"),
        country_cn: getCountryName(upperCode, "zh-Hans"),
        country_english: getCountryName(upperCode, "en"),
        currency: market.currency?.iso_code || "USD",
        currency_symbol: market.currency?.symbol || "$",
        market_id: market.market_id,
        market_name: market.market_name,
      };
      countryMap[country_code] = countryItem;
      countryList.push(countryItem);
    });
  });

  countryList.sort((a, b) => a.country.localeCompare(b.country));

  return { countryList, countryMap };
};

const buildMarketSettings = () => {
  const markets = getSettingMarkets();
  const supportedAreas = [
    ...new Set(
      markets.flatMap((market) =>
        (market.countries || []).map((code) => String(code).toLowerCase())
      )
    ),
  ];
  const defaultArea = supportedAreas.includes("us")
    ? "us"
    : supportedAreas[0] || "us";
  const { countryList, countryMap } = buildCountryData(markets);

  return { markets, supportedAreas, defaultArea, countryList, countryMap };
};

const settings = buildMarketSettings();

const resolveArea = (area) => {
  const normalized = String(area || "").toLowerCase();
  return settings.supportedAreas.includes(normalized)
    ? normalized
    : settings.defaultArea;
};

module.exports = {
  ...settings,
  getSettingMarkets,
  resolveArea,
};
