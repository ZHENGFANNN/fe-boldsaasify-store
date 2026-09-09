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
//   - 运营配置追加：seoOverrides.getSitemapExtras() 追加 adds、剔除 excludes
//     （构建期从 fetch-data/seo/index.json 读，接口挂了走空骨架）。
//     ⚠️ adds/excludes 统一「路径」语义：站内路径（/ 开头）按站点启用的
//     所有 locale 自动展开前缀（en 无前缀，其余 /{locale}），一条路径覆盖
//     全部语言变体；站外绝对 URL（http 开头）仅 add 支持、原样单条落。
// ============================================================

import { locales } from "@/config/languageSettings";
import getProductPaths from "@/config/Api/getProductPaths";
import getBlogPaths from "@/config/Api/getBlogPaths";
import getArticlePaths from "@/config/Api/getArticlePaths";
import { getAllTagPaths } from "@/config/Api/getTagProducts";
import {
  getSitemapExtras,
  normalizePathname,
} from "@/config/seoOverrides";
import type { MetadataRoute } from "next";

type SitemapEntry = MetadataRoute.Sitemap[number];

const DOMAIN = process.env.NEXT_PUBLIC_DOMAIN || "";

// 可索引的静态路由（不含 [locale] 前缀，en 不加前缀）。
// 排除：/user/*（登录/注册/重置/账户/忘记等私有认证页，改由 robots disallow）、
//       /order /order/info /cart /[...notFound]（私有/无意义）。
// changeFrequency / priority 按 sitemap 协议常规取值（priority 为站内相对权重）。
const STATIC_PATHS: {
  path: string;
  changeFrequency: SitemapEntry["changeFrequency"];
  priority: number;
}[] = [
  { path: "", changeFrequency: "daily", priority: 1.0 }, // 首页
  { path: "/blog", changeFrequency: "weekly", priority: 0.6 },
  // 估价器：搜索意图明确（"lab grown diamond price" 类查询）且内容不随库变，
  // 权重高于客服页；表校准后内容会变，故按 monthly。
  { path: "/quote", changeFrequency: "monthly", priority: 0.7 },
  { path: "/support/contact", changeFrequency: "monthly", priority: 0.3 }
];

// 拼绝对 URL：en 无前缀，其余 /{locale}；path 为空时回退到域名根。
function toUrl(locale, path) {
  const prefix = locale === "en" ? "" : `/${locale}`;
  const full = `${prefix}${path}`;
  return `${DOMAIN}${full || "/"}`;
}

// 从 URL 反算出无 locale 前缀的 pathname，用于 excludes 精确匹配。
// - 支持绝对 URL（http(s)://...）和相对路径（/xxx）
// - 剥掉 DOMAIN 前缀与 /{locale} 前缀，归一化后返回（`/blog` / `/blog/` / `/BLOG` 均等价）
function toBasePathname(url) {
  if (!url) return "/";
  let p = String(url);
  if (DOMAIN && p.startsWith(DOMAIN)) p = p.slice(DOMAIN.length);
  // 保留只有 pathname 部分（丢 query/hash，理论上 sitemap 内条目无这两者）
  p = p.split("?")[0].split("#")[0];
  if (!p.startsWith("/")) p = `/${p}`;
  // 剥 /{locale}（仅剥已知启用的 locale，避免误伤如 /order 之类首段）
  for (const loc of locales) {
    if (loc === "en") continue;
    if (p === `/${loc}` || p.startsWith(`/${loc}/`)) {
      p = p.slice(loc.length + 1) || "/";
      break;
    }
  }
  return normalizePathname(p);
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const lastModified = new Date();
  const seen = new Set<string>();
  const entries: SitemapEntry[] = [];

  const push = (
    url,
    opts?: {
      changeFrequency?: SitemapEntry["changeFrequency"];
      priority?: number;
    }
  ) => {
    if (!url || seen.has(url)) return;
    seen.add(url);
    const entry: SitemapEntry = { url, lastModified };
    if (opts?.changeFrequency) entry.changeFrequency = opts.changeFrequency;
    if (typeof opts?.priority === "number") entry.priority = opts.priority;
    entries.push(entry);
  };

  // 静态路由 × 所有 locale（各自带常规 changeFrequency / priority）
  for (const locale of locales) {
    for (const { path, changeFrequency, priority } of STATIC_PATHS) {
      push(toUrl(locale, path), { changeFrequency, priority });
    }
  }

  // 商品 / 博客（详情 + 所属分类），按 path 自身 locale 生成
  const [productPaths, blogPaths, articlePaths, tagPaths] = await Promise.all([
    getProductPaths(),
    getBlogPaths(),
    getArticlePaths(),
    getAllTagPaths()
  ]);

  // 分类页（列表）权重高于单个详情：分类 0.8 / 商品详情 0.6
  productPaths.forEach(({ locale, sortKey, productKey }) => {
    push(toUrl(locale, `/product/${sortKey}`), {
      changeFrequency: "weekly",
      priority: 0.8
    });
    push(toUrl(locale, `/product/${sortKey}/${productKey}`), {
      changeFrequency: "weekly",
      priority: 0.6
    });
  });

  // 商品标签聚合页 /tag/{key}（介于分类 0.8 与详情 0.6，标签聚合页价值中等）
  tagPaths.forEach(({ locale, tagKey }) => {
    push(toUrl(locale, `/tag/${tagKey}`), {
      changeFrequency: "weekly",
      priority: 0.7
    });
  });

  // 博客分类 0.5 / 博文详情 0.5（更新较慢）
  blogPaths.forEach(({ locale, sortKey, blogKey }) => {
    push(toUrl(locale, `/blog/${sortKey}`), {
      changeFrequency: "weekly",
      priority: 0.5
    });
    push(toUrl(locale, `/blog/${sortKey}/${blogKey}`), {
      changeFrequency: "monthly",
      priority: 0.5
    });
  });

  // 文章配置（政策/协议等，取代已下线的 /protocol 静态页）——低频低权重
  articlePaths.forEach(({ locale, sortKey, articleKey }) => {
    push(toUrl(locale, `/article/${sortKey}/${articleKey}`), {
      changeFrequency: "yearly",
      priority: 0.3
    });
  });

  // 运营配置：先剔除 excludes 精确匹配，再追加 adds
  const { adds, excludes } = getSitemapExtras();

  let finalEntries = entries;
  if (excludes.size > 0) {
    // excludes 后台存的是完整 URL（含域名，如 https://.../support/contact），
    // 而条目侧比对用的是无 locale 前缀的 pathname；两边都过 toBasePathname
    // 归一到同一形态（剥域名 + 剥 /{locale} + 小写去尾斜杠）再比，否则永不命中。
    const excludeBases = new Set(
      Array.from(excludes).map((x) => toBasePathname(x))
    );
    finalEntries = entries.filter(
      (e) => !excludeBases.has(toBasePathname(e.url))
    );
  }

  // adds：统一按「路径」语义。
  //   - `/` 开头（站内路径）：先归一化剥掉用户可能误粘的域名/locale 前缀，
  //     再按站点启用的所有 locale 自动展开（en 无前缀，其余 /{locale}）+ 拼 DOMAIN，
  //     与 exclude 的路径语义对称 —— 一条路径覆盖全部语言变体。
  //   - `http(s)` 开头（站外绝对 URL）：无本站 locale 概念，原样单条落。
  const addedSeen = new Set(finalEntries.map((e) => e.url));
  const pushAdd = (
    url: string,
    item: { change_freq?: string; priority?: number }
  ) => {
    if (addedSeen.has(url)) return;
    addedSeen.add(url);
    const entry: SitemapEntry = { url, lastModified };
    if (item.change_freq)
      entry.changeFrequency =
        item.change_freq as SitemapEntry["changeFrequency"];
    if (typeof item.priority === "number") entry.priority = item.priority;
    finalEntries.push(entry);
  };
  adds.forEach((item) => {
    if (!item?.url) return;
    const raw = String(item.url).trim();
    if (!raw) return;
    if (raw.startsWith("/")) {
      // 站内路径 → 归一化 + 跨 locale 展开
      const base = toBasePathname(raw); // 剥域名/locale/尾斜杠、小写
      const path = base === "/" ? "" : base;
      for (const locale of locales) pushAdd(toUrl(locale, path), item);
    } else {
      // 站外绝对 URL → 原样单条
      pushAdd(raw, item);
    }
  });

  return finalEntries;
}
