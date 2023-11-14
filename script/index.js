const fetchConfig = require("./fetch-config.js");
const fetchProductInfo = require("./fetch-product-info.js");
const fetchProductSort = require("./fetch-product-sort.js");
const fetchLanguage = require("./fetch-language.js");

async function getData() {
  await Promise.all([
    fetchLanguage(),
    fetchConfig(),
    fetchProductSort(),
    fetchProductInfo(),
  ]);
  // const createSitemap = require('./create-sitemap.js')
  // createSitemap()
}
getData();
