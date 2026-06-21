/** @format */

// 构建期时序容错：首次 CI 构建时 globalConfig/index.json 由 fetch-config 写入，
// 在其生成前本模块（被 middleware import）若直接 require 会 MODULE_NOT_FOUND 致编译失败。
// 与 languageSettings.ts 的 loadGlobalConfig 一致，缺失时退回空配置（markets=[]、defaultArea=us）。

/** ERP setting.markets 单条原始记录 */
export interface SettingMarket {
  market_id?: string | number;
  market_name?: string;
  enabled?: boolean;
  is_default?: boolean;
  countries?: Array<string | number>;
  currency?: { iso_code?: string; symbol?: string };
}

/** 派生后的国家/地区项 */
export interface CountryItem {
  country_code: string;
  continent_code: string;
  country: string;
  country_cn: string;
  country_english: string;
  currency: string;
  currency_symbol: string;
  market_id?: string | number;
  market_name?: string;
}

interface GlobalConfig {
  "setting.markets"?: SettingMarket[];
  [key: string]: unknown;
}

const loadGlobalConfig = (): GlobalConfig => {
  try {
    return require("../../fetch-data/globalConfig/index.json") as GlobalConfig;
  } catch {
    return {};
  }
};

const globalConfig = loadGlobalConfig();

export const getSettingMarkets = (): SettingMarket[] =>
  (globalConfig["setting.markets"] ?? []).filter((item) => item.enabled);

const getCountryName = (code: string, locale: string): string => {
  try {
    return (
      new Intl.DisplayNames([locale], { type: "region" }).of(
        String(code).toUpperCase()
      ) || String(code).toUpperCase()
    );
  } catch {
    return String(code).toUpperCase();
  }
};

const buildCountryData = (
  markets: SettingMarket[]
): { countryList: CountryItem[]; countryMap: Record<string, CountryItem> } => {
  const countryMap: Record<string, CountryItem> = {};
  const countryList: CountryItem[] = [];

  markets.forEach((market) => {
    (market.countries || []).forEach((code) => {
      const country_code = String(code).toLowerCase();
      if (countryMap[country_code]) return;

      const upperCode = String(code).toUpperCase();
      const countryItem: CountryItem = {
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

/**
 * 解析默认地区，与 ERP「默认市场」对齐，逐级兜底：
 * ① ERP 标记 is_default 的(已启用)市场的首个国家
 * ② 兼容历史固定 market_id === 'default' 的市场首个国家
 * ③ 支持地区里有 us 用 us
 * ④ 退到首个支持地区
 * ⑤ 兜底 "us"
 */
const resolveDefaultArea = (
  markets: SettingMarket[],
  supportedAreas: string[]
): string => {
  const pickFirstCountry = (m?: SettingMarket): string | undefined => {
    const code = (m?.countries || [])[0];
    return code ? String(code).toLowerCase() : undefined;
  };

  const explicitDefault =
    pickFirstCountry(markets.find((m) => m.is_default)) ||
    pickFirstCountry(markets.find((m) => m.market_id === "default"));
  if (explicitDefault && supportedAreas.includes(explicitDefault)) {
    return explicitDefault;
  }

  if (supportedAreas.includes("us")) return "us";
  return supportedAreas[0] || "us";
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
  const defaultArea = resolveDefaultArea(markets, supportedAreas);
  const { countryList, countryMap } = buildCountryData(markets);

  return { markets, supportedAreas, defaultArea, countryList, countryMap };
};

const settings = buildMarketSettings();

// 具名导出（与原 module.exports 字段一致，供 ESM 具名导入）
export const markets: SettingMarket[] = settings.markets;
export const supportedAreas: string[] = settings.supportedAreas;
export const defaultArea: string = settings.defaultArea;
export const countryList: CountryItem[] = settings.countryList;
export const countryMap: Record<string, CountryItem> = settings.countryMap;

export const resolveArea = (area?: string | null): string => {
  const normalized = String(area || "").toLowerCase();
  return supportedAreas.includes(normalized) ? normalized : defaultArea;
};

export default {
  markets,
  supportedAreas,
  defaultArea,
  countryList,
  countryMap,
  getSettingMarkets,
  resolveArea,
};

