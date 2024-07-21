/** @format */

const cn = require("@@/locale/blogList/cn.json");
const de = require("@@/locale/blogList/de.json");
const en = require("@@/locale/blogList/en.json");
const es = require("@@/locale/blogList/es.json");
const fr = require("@@/locale/blogList/fr.json");
const hk = require("@@/locale/blogList/hk.json");
const it = require("@@/locale/blogList/it.json");
const ja = require("@@/locale/blogList/ja.json");
const ko = require("@@/locale/blogList/ko.json");
const ru = require("@@/locale/blogList/ru.json");

const blogList = {
  cn,
  de,
  en,
  es,
  fr,
  hk,
  it,
  ja,
  ko,
  ru,
};

export default async function getBlogList(lang) {
  return blogList[lang].filter((item) => item.blogList?.length > 0);
}
