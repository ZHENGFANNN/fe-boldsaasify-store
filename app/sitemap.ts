/** @format */

// ============================================================
// Next.js 原生 sitemap（替代 script/create-sitemap.js）
// 构建期生成 /sitemap.xml（无动态数据访问 → 静态产物）。
//
// 组成：
//   - 静态路由：手工维护的可索引页面（排除 user/account、order 等私有页）
//   - 商品/博客详情 + 分类：复用 getProductPaths / getBlogPaths（与
//     generateStaticParams 同源），按各 path 自身的 locale 生成，
//     与实际预渲染页面一致（不再像旧脚本那样跨所有 locale 笛卡尔展开）。
// ============================================================

import { locales } from "@/config/languageSettings";
import getProductPaths from "@/config/Api/getProductPaths";
import getBlogPaths from "@/config/Api/getBlogPaths";

const DOMAIN = process.env.NEXT_PUBLIC_DOMAIN || "";

// 可索引的静态路由（不含 [locale] 前缀，en 不加前缀）。
// 排除：/user/account /user/forget /order /order/info /[...notFound]（私有/无意义）。
const STATIC_PATHS = [
  "", // 首页
  "/support/after-sale",
  "/support/contact",
  "/blog",
  "/protocol/policy",
  "/protocol/sales",
  "/protocol/user",
  "/user/login",
  "/user/register",
  "/user/reset-password"
];

// 拼绝对 URL：en 无前缀，其余 /{locale}；path 为空时回退到域名根。
function toUrl(locale, path) {
  const prefix = locale === "en" ? "" : `/${locale}`;
  const full = `${prefix}${path}`;
  return `${DOMAIN}${full || "/"}`;
}

export default async function sitemap() {
  const lastModified = new Date();
  const seen = new Set();
  const entries = [];

  const push = (url) => {
    if (!url || seen.has(url)) return;
    seen.add(url);
    entries.push({ url, lastModified });
  };

  // 静态路由 × 所有 locale
  for (const locale of locales) {
    for (const path of STATIC_PATHS) {
      push(toUrl(locale, path));
    }
  }

  // 商品 / 博客（详情 + 所属分类），按 path 自身 locale 生成
  const [productPaths, blogPaths] = await Promise.all([
    getProductPaths(),
    getBlogPaths()
  ]);

  productPaths.forEach(({ locale, sortKey, productKey }) => {
    push(toUrl(locale, `/product/${sortKey}`));
    push(toUrl(locale, `/product/${sortKey}/${productKey}`));
  });

  blogPaths.forEach(({ locale, sortKey, blogKey }) => {
    push(toUrl(locale, `/blog/${sortKey}`));
    push(toUrl(locale, `/blog/${sortKey}/${blogKey}`));
  });

  return entries;
}
