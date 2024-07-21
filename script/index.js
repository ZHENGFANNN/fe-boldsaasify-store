const fetchConfig = require("./fetch-config.js");
const fetchProductInfo = require("./fetch-product-info.js");
const fetchProductSort = require("./fetch-product-sort.js");
const fetchLanguage = require("./fetch-language.js");
const fetchBlog = require("./fetch-blog.js");
const fetchFestivalDiscount = require("./fetch-festival-discount.js");

async function getData() {
  await Promise.all([
    fetchBlog(),
    fetchLanguage(),
    fetchConfig(),
    fetchProductSort(),
    fetchProductInfo(),
    fetchFestivalDiscount(),
  ]);
  const createSitemap = require("./create-sitemap.js");
  createSitemap();
}
getData();
