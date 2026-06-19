/**
 * 语言 / locale 配置（构建期从 globalConfig 派生，运行时只读快照）。
 *
 * 数据来源：`fetch-data/globalConfig/index.json` 的 `setting.language` 字段，
 * 由 `yarn fetch-prod` → `script/fetch-config.js` 写入。
 *
 * 使用约定：
 * - Next 运行时（middleware、i18n、页面）：直接 import 本模块的导出字段。
 * - 构建脚本：在 `fetch-config` 写盘后可调用 `reload()` 刷新快照（当前无构建脚本依赖，保留为兜底 API）。
 *
 * 容错：首次 CI 构建时 globalConfig 可能尚不存在，load 失败时退回空配置 + 默认 `en`，
 * 避免模块加载即崩溃；`fetch-config` 完成后通过 `reload()` 读到真实语言列表。
 */

/** ERP `setting.language` 单条原始记录 */
interface SettingLanguage {
  enabled?: boolean;
  iso_code?: string;
  endonym_name?: string;
  name?: string;
  root_url?: string;
  primary?: boolean;
}

/** 派生后的语言项：路由 segment `[locale]` 与前端展示共用 */
export interface LanguageItem {
  /** 小写 locale，如 `en`、`zh-cn` */
  value: string;
  /** 展示名（优先 endonym_name） */
  label: string;
  iso_code?: string;
  root_url?: string;
  primary: boolean;
}

/** `buildLanguageSettings` 的完整快照 */
export interface LanguageSettingsSnapshot {
  settingLanguages: SettingLanguage[];
  languageList: LanguageItem[];
  languageMap: Record<string, LanguageItem>;
  locales: string[];
  defaultLocale: string;
}

/** globalConfig 中与本模块相关的字段（其余键保持开放） */
interface GlobalConfig {
  "setting.language"?: SettingLanguage[];
  [key: string]: unknown;
}

/** 将 ERP iso_code 规范为小写 locale 字符串 */
export const toLocale = (isoCode?: string | null): string =>
  String(isoCode || "").toLowerCase();

const GLOBAL_CONFIG_PATH = "../../fetch-data/globalConfig/index.json";

/**
 * 读取 globalConfig JSON。
 * 文件不存在时返回 `{}`，供首次构建容错。
 */
const loadGlobalConfig = (): GlobalConfig => {
  try {
    // 必须用字面量路径 require：webpack 仅对字面量参数静态内联 JSON 模块；
    // 用变量（GLOBAL_CONFIG_PATH）会被编译成 require-context 运行时查找，
    // 打包后的 server bundle 里查不到文件 → 回退空配置 → locales 退化为 ["en"]
    // （sitemap / [locale] layout 的 generateStaticParams 因此只生成 en）。
    // 对照 app/config/marketSettings.js 同样用字面量 require 才能读到数据。
    return require("../../fetch-data/globalConfig/index.json") as GlobalConfig;
  } catch {
    return {};
  }
};

/**
 * 从 globalConfig 派生语言列表、locale 数组与默认语言。
 * 无启用语言时 fallback 为 `["en"]` / `defaultLocale = "en"`。
 */
const buildLanguageSettings = (
  globalConfig: GlobalConfig
): LanguageSettingsSnapshot => {
  const settingLanguages = (globalConfig["setting.language"] ?? []).filter(
    (item) => item.enabled
  );

  const languageList: LanguageItem[] = settingLanguages.map((item) => {
    const value = toLocale(item.iso_code);
    return {
      value,
      label: item.endonym_name || item.name || value,
      iso_code: item.iso_code,
      root_url: item.root_url,
      primary: Boolean(item.primary),
    };
  });

  const languageMap: Record<string, LanguageItem> = {};
  languageList.forEach((item) => {
    languageMap[item.value] = item;
  });

  const locales = languageList.map((item) => item.value);
  const primaryItem =
    settingLanguages.find((item) => item.primary) || settingLanguages[0];
  const defaultLocale = primaryItem
    ? toLocale(primaryItem.iso_code)
    : locales[0] || "en";

  return {
    settingLanguages,
    languageList,
    languageMap,
    locales: locales.length ? locales : ["en"],
    defaultLocale,
  };
};

/** 当前内存快照；`reload()` 会替换并同步到下方 export 变量 */
let current = buildLanguageSettings(loadGlobalConfig());

/** 对外暴露的可变绑定，`reload()` 会原地更新（兼容 CJS require 与 ESM named import） */
export let languageList = current.languageList;
export let languageMap = current.languageMap;
export let locales = current.locales;
export let defaultLocale = current.defaultLocale;

export const getSettingLanguages = (): SettingLanguage[] =>
  current.settingLanguages;

/**
 * 将任意 locale 规范为已启用列表中的值，否则返回 `defaultLocale`。
 * 用于 middleware / i18n 路由兜底。
 */
export const resolveLocale = (locale?: string | null): string => {
  const normalized = toLocale(locale);
  return current.locales.includes(normalized)
    ? normalized
    : current.defaultLocale;
};

/**
 * 构建期专用：清除 require 缓存并重新从磁盘读取 globalConfig。
 * 在 `fetch-config` 写盘之后调用可读到真实语言列表（当前无调用方，保留为兜底 API）。
 */
export function reload(): LanguageSettingsSnapshot {
  try {
    if (typeof require !== "undefined" && require.cache) {
      delete require.cache[require.resolve(GLOBAL_CONFIG_PATH)];
    }
  } catch {
    // 构建期路径解析失败时忽略，退回空配置
  }
  current = buildLanguageSettings(loadGlobalConfig());
  languageList = current.languageList;
  languageMap = current.languageMap;
  locales = current.locales;
  defaultLocale = current.defaultLocale;
  return current;
}

/** 默认导出：供 `import languageSettings from "..."` 使用（getter 保证 reload 后读到新值） */
const languageSettings = {
  get languageList() {
    return languageList;
  },
  get languageMap() {
    return languageMap;
  },
  get locales() {
    return locales;
  },
  get defaultLocale() {
    return defaultLocale;
  },
  getSettingLanguages,
  toLocale,
  resolveLocale,
  reload,
};

export default languageSettings;
