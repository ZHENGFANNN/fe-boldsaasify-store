/** @format */

const { defaultLocale, locales } = require("@@/app/config/languageSettings");

// 启用 locale 统一复用 languageSettings 的 locales（口径=item.enabled 真值 + en 兜底），
// 不再用不一致的 `enabled !== false` 自行从 globalConfig 派生——后者会把无 enabled 字段的
// 语言也算启用，进而去 require 一个 fetch-language 未生成的文案文件 → 构建期 MODULE_NOT_FOUND。
// 每个 locale 的 require 加 try/catch：文案文件尚未生成/缺失时跳过，不阻断模块加载。
const languageList = Object.fromEntries(
  locales
    .map((locale) => {
      try {
        return [locale, require(`@@/fetch-data/languageList/${locale}.json`)];
      } catch {
        return null;
      }
    })
    .filter(Boolean)
);

/**
 * 命名空间兼容映射。
 *
 * 背景：前端代码统一用 `store.*` / `www.*` 前缀的命名空间取词
 * （如 LANG["www.user_login.title"]、LANG["store.index.title"]），
 * 但语言库 config_languages_list 迁移后存的是「裸命名 + 部分改名」
 * （如 home / order_checkout / user_account / user_forget / protocol_sales）。
 * 这里把前端命名空间翻译成语言库命名空间，取词后再用前端前缀键回填，
 * 从而无需改库、无需翻译即可恢复绝大多数页面文案。
 *
 * NS_RENAME 仅改写「去掉 store./www. 前缀后的第一段」。
 * 库里已无对应命名空间的（如 company_market/supplier/technology）会自然落空，
 * 属于真缺文案，单独补录，不在本映射处理范围内。
 */
const NS_RENAME = {
  index: "home",
  order: "order_checkout",
  account: "user_account",
  forget: "user_forget",
  sales_policy: "protocol_sales",
  blog_index: "blog",
};

// 前端命名空间 → 语言库命名空间
function toDbNamespace(ns) {
  const bare = ns.replace(/^(store|www)\./, "");
  const segs = bare.split(".");
  if (NS_RENAME[segs[0]]) segs[0] = NS_RENAME[segs[0]];
  return segs.join(".");
}

// LANGUAGE过滤
const filterLanguage = function ({ localeLanguage, languageNameSpace }) {
  const languageObj = {};
  if (!localeLanguage) return languageObj;
  languageNameSpace.forEach((ns) => {
    const dbNs = toDbNamespace(ns);
    Object.keys(localeLanguage).forEach((key) => {
      // 命名空间边界匹配，避免 user 误命中 user_account
      if (key === dbNs || key.startsWith(`${dbNs}.`)) {
        // 用前端前缀回填：把库里命名空间替换回前端请求的命名空间
        const feKey = ns + key.slice(dbNs.length);
        if (!languageObj[feKey]) languageObj[feKey] = localeLanguage[key];
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
  const localeLanguage =
    languageList[locale] || languageList[defaultLocale];
  return filterLanguage({ localeLanguage, languageNameSpace });
}
