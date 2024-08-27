/** @format */

// 加载特定环境的 .env 文件
const dotenv = require("dotenv");
const env = process.env.NODE_ENV === "local" ? ".local" : "";
const envFile = `.env${env}`;
dotenv.config({ path: envFile });

const fetchConfig = require("./fetch-config.js");
const fetchProductInfo = require("./fetch-product-info.js");
const fetchProductSort = require("./fetch-product-sort.js");
const fetchLanguage = require("./fetch-language.js");
const fetchBlog = require("./fetch-blog.js");
const fetchFestivalDiscount = require("./fetch-festival-discount.js");

// const fetchProduct = require("./fetch-product.js");

async function getData() {
  await Promise.all([
    fetchBlog(),
    fetchLanguage(),
    fetchConfig(),
    fetchProductSort(),
    fetchProductInfo(),
    fetchFestivalDiscount(),
    // fetchProduct(),
  ]);
  const createSitemap = require("./create-sitemap.js");
  createSitemap();
}
getData();

module.exports = getData;
