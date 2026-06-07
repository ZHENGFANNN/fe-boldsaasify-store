/** @format */

const chalk = require("chalk");
const fs = require("fs");
const path = require("path");
const api = require("./api");

/**
 * 从两个公开接口拉取配置，按后端 code 原样写入：
 *   fetch-data/pageConfig/<locale>.json  ← /config/getPageSettings
 *   fetch-data/globalConfig/index.json   ← /config/getGlobalSettings
 *
 * locale 取自 globalConfig.setting.language 的 iso_code（小写）
 */

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

const toLocale = (isoCode) => String(isoCode || "").toLowerCase();

const getPageValue = (item, locale) => {
  let raw = item[locale];
  if (isEmptyCell(raw)) raw = item.en;
  if (isEmptyCell(raw)) return undefined;
  return parseCell(raw);
};

const buildPageConfig = (pageList, locale) => {
  const target = {};
  pageList.forEach((item) => {
    const value = getPageValue(item, locale);
    if (value !== undefined && item.code) {
      target[item.code] = value;
    }
  });
  return target;
};

const buildGlobalConfig = (globalList) => {
  const target = {};
  globalList.forEach((item) => {
    if (isEmptyCell(item.content) || !item.code) return;
    target[item.code] = parseCell(item.content);
  });
  return target;
};

const writeJson = (filePath, data) => {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(data, null, 0));
};

const getEnabledLanguages = (globalConfig) =>
  (globalConfig["setting.language"] ?? []).filter(
    (item) => item.enabled !== false
  );

const fetchConfig = async (times = 1, cookie = "") => {
  let error = false;
  const startTime = Date.now();
  console.log(`${chalk.yellow("【开始获取配置信息】")}`);

  try {
    const [pageRes, globalRes] = await Promise.all([
      api.get("/config/getPageSettings", { headers: { cookie } }),
      api.get("/config/getGlobalSettings", { headers: { cookie } }),
    ]);

    const pageList = pageRes?.data?.list || [];
    const globalList = globalRes?.data?.list || [];
    const globalConfig = buildGlobalConfig(globalList);

    writeJson("./fetch-data/globalConfig/index.json", globalConfig);

    getEnabledLanguages(globalConfig).forEach((item) => {
      const locale = toLocale(item.iso_code);
      writeJson(
        `./fetch-data/pageConfig/${locale}.json`,
        buildPageConfig(pageList, locale)
      );
    });
  } catch (err) {
    console.log(`${chalk.red("【配置信息获取失败】")}`, err);
    error = true;
  } finally {
    console.log(
      `${chalk.green("【配置信息获取时长】")} ${Date.now() - startTime}ms`
    );
    times += 1;
    if (error && times < 4) {
      console.log(`${chalk.red(`【!!!配置信息第${times}次获取!!!】`)}`);
      return fetchConfig(times, cookie);
    }
    if (error && times > 3) {
      console.log(`${chalk.red("【!!!配置信息连续三次获取失败!!!】")}`);
      throw new Error("【!!!配置信息连续三次获取失败!!!】");
    }
  }
};

module.exports = fetchConfig;
