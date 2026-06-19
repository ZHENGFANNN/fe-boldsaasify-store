/** @format */

require("./register-ts");

// 加载特定环境的 .env 文件
const dotenv = require("dotenv");
const env = process.env.NODE_ENV === "local" ? ".local" : "";
const envFile = `.env${env}`;
dotenv.config({ path: envFile });

const fetchConfig = require("./fetch-config.js");

// 注意：product / blog 不再构建期物化，改为运行时从后端拉取 + ISR。
// 文案（language）已改为运行时按命名空间从后端拉取（app/config/Api/getRemoteLanguage.ts）+ ISR，
//   不再构建期物化到 fetch-data/languageList，故 fetchLanguage 已移除。
// 节日折扣（getFestivalDiscount）已下线，后端表与接口已移除，不再构建期拉取。
// sitemap 改用 Next 原生 app/sitemap.js（构建期生成 /sitemap.xml），不再走脚本。
// 这里只保留仍需物化的 config。
async function getData() {
  await fetchConfig();
}
getData();

module.exports = getData;
