/** @format */

// ============================================================
// Next.js 原生 robots（替代静态 public/robots.txt）。
// 域名统一取 NEXT_PUBLIC_DOMAIN —— 与 app/sitemap.ts、app/config/seo.ts
// 同源，避免再次硬编码导致旧域名残留。DOMAIN 未配置时省略 host/sitemap，
// 不输出残缺值。
// ============================================================

import type { MetadataRoute } from "next";

const DOMAIN = String(process.env.NEXT_PUBLIC_DOMAIN || "").replace(/\/$/, "");

export default function robots(): MetadataRoute.Robots {
  const result: MetadataRoute.Robots = {
    rules: {
      userAgent: "*",
      allow: "/",
      // 私有/无意义路径（[locale] 前缀用 /*/ 通配；/config/* 为内部数据管道）。
      disallow: [
        "/*/user/account",
        "/*/user/forget",
        "/*/cart",
        "/*/order",
        "/config/*"
      ]
    }
  };

  if (DOMAIN) {
    result.sitemap = `${DOMAIN}/sitemap.xml`;
    result.host = DOMAIN;
  }

  return result;
}
