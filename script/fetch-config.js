/** @format */

const chalk = require("chalk");
const fs = require("fs");
const api = require("./api");

const { languageList } = require("../app/config/LANGUAGE");

/**
 * 配置存储重构（脱离已删除的 config_config_list / /config/getConfigList）
 * ------------------------------------------------------------------
 * 旧表 config_config_list / config_config_text 已 DROP，旧接口 /config/getConfigList 已下线。
 * 现改为调用两个新公开接口，并在本文件做「兼容层」：把新表数据映射回前台现有的旧 code 键，
 * 仍按每个 locale 输出 locale/configList/<locale>.json（{ 旧code: 解析值 }），消费组件零改动。
 *
 *   /config/getPageSettings   → config_page_settings（多语言列 en / zh-cn / ja，每格一段 JSON 文本）
 *   /config/getGlobalSettings → config_global_settings（单 content，与语言无关）
 *
 * 后端各列均以原始 JSON 文本（string）返回，这里统一 JSON.parse 还原：
 *   - protocol.*.article 格内是「JSON 字符串」→ parse 得 HTML 串；
 *   - banner / base / social 等是「结构」→ parse 得数组/对象。
 */

// 前台 locale → config_page_settings 的数据库列（其余 locale 回退 en）
const LOCALE_TO_COLUMN = { en: "en", cn: "zh-cn", ja: "ja" };
const columnForLocale = (locale) => LOCALE_TO_COLUMN[locale] || "en";

// 页面配置：新 code → 前台旧键（一个新 code 可写多个旧键）。
// common.base 为对象，单独拆解为 company.basic.<field>，不在此表。
const PAGE_KEY_MAP = {
  "home.banner": ["store.index.banner", "page.home.banner"],
  "common.top_bar": ["page.common.top_bar"],
  "common.top_nav": ["page.common.nav_list"],
  "common.footer_nav": ["page.common.footer_data"],
  "common.social": ["company.social_media.index"],
  "protocol.policy.article": ["page.protocol.policy.content"],
  "protocol.sales.article": ["page.protocol.sales.content"],
  "protocol.user.article": ["page.protocol.user.content"],
  "protocol.cookie.article": ["page.protocol.cookie.content"],
};

// 空值判定（与旧逻辑一致：空串 / "null" / "[]" 视为缺省，触发 en 回退）
const isEmptyCell = (v) => {
  if (v === undefined || v === null) return true;
  const s = String(v).trim();
  return s === "" || s === "null" || s === "[]";
};

const parseCell = (raw) => {
  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
};

// 取某 locale 在 page 行里的解析值：先取对应语言列，空则回退 en 列
const getPageValue = (item, locale) => {
  let raw = item[columnForLocale(locale)];
  if (isEmptyCell(raw)) raw = item.en;
  if (isEmptyCell(raw)) return undefined;
  return parseCell(raw);
};

// 把一行 page 配置写进某 locale 的结果对象（按旧键映射）
const applyPageItem = (target, item, locale) => {
  const value = getPageValue(item, locale);
  if (value === undefined) return;

  // 基本信息：common.base 对象 → 拆解为 company.basic.<field>
  if (item.code === "common.base") {
    if (value && typeof value === "object" && !Array.isArray(value)) {
      Object.keys(value).forEach((field) => {
        target[`company.basic.${field}`] = value[field];
      });
    }
    return;
  }

  const legacyKeys = PAGE_KEY_MAP[item.code];
  if (legacyKeys) {
    legacyKeys.forEach((key) => {
      target[key] = value;
    });
  } else {
    // 未在映射表里的 code 原样落库键，保留兼容
    target[item.code] = value;
  }
};

// 获取配置信息
const fetchConfig = async (times = 1, cookie = "") => {
  let error = false;
  const startTime = new Date().getTime();
  const fileDir = "./locale/configList";
  if (!fs.existsSync(fileDir)) fs.mkdirSync(fileDir, { recursive: true });
  console.log(`${chalk.yellow("【开始获取配置信息】")}`);

  try {
    const [pageRes, globalRes] = await Promise.all([
      api.get("/config/getPageSettings", { headers: { cookie } }),
      api.get("/config/getGlobalSettings", { headers: { cookie } }),
    ]);

    const pageList = (pageRes && pageRes.data && pageRes.data.list) || [];
    const globalList =
      (globalRes && globalRes.data && globalRes.data.list) || [];

    // 全局配置与语言无关：先解析一份，写进每个 locale（setting.markets/language/pay）
    const globalObj = {};
    globalList.forEach((item) => {
      if (isEmptyCell(item.content)) return;
      globalObj[item.code] = parseCell(item.content);
    });

    const obj = {};
    languageList.forEach((lang) => {
      const locale = lang.value;
      const target = {};
      pageList.forEach((item) => applyPageItem(target, item, locale));
      Object.assign(target, globalObj);
      obj[locale] = target;
    });

    Object.keys(obj).forEach((locale) => {
      const fileData = JSON.stringify(obj[locale], null, 0);
      fs.writeFile(`${fileDir}/${locale}.json`, fileData, (err) => {
        if (err) {
          console.log(`${chalk.red("【配置信息写入失败】")}`, err);
          error = true;
        }
      });
    });
  } catch (err) {
    console.log(`${chalk.red("【配置信息获取失败】")}`, err);
    error = true;
  } finally {
    console.log(
      `${chalk.green("【配置信息获取时长】")} ${
        new Date().getTime() - startTime
      }ms`
    );
    times = times + 1;
    if (error && times < 4) {
      console.log(`${chalk.red(`【!!!配置信息第${times}次获取!!!】`)}`);
      fetchConfig(times, cookie);
    }
    if (error && times > 3) {
      console.log(`${chalk.red("【!!!配置信息连续三次获取失败!!!】")}`);
      throw "【!!!配置信息连续三次获取失败!!!】";
    }
  }
};

module.exports = fetchConfig;
