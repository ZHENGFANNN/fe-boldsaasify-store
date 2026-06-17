/**
 * SEO 多语言 alternates 生成。
 *
 * 为页面的 metadata 生成 `alternates.canonical` 与 `alternates.languages`（hreflang），
 * 让搜索引擎识别同一页面的多语言版本互为替代。
 *
 * URL 前缀约定与 `middleware.js`(buildLocalizedPath) 及
 * `script/create-sitemap.js`(expandLocales) 保持一致：
 *   - defaultLocale（en）不带前缀
 *   - 其它语言带 `/{locale}` 前缀
 *
 * 入参 `path` 为「不含 locale 前缀」的页面路径（如 "/"、"/blog"、"/product/rings"），
 * 由各页 generateMetadata 从自身 route params 拼出，避免读取 headers 而破坏静态化(ISR)。
 */
import { locales, defaultLocale } from "@/config/languageSettings";

const DOMAIN = String(process.env.NEXT_PUBLIC_DOMAIN || "").replace(/\/$/, "");

/** 给定无前缀路径与目标 locale，返回该语言版本的绝对 URL */
function localizedUrl(path: string, locale: string): string {
  const clean = !path || path === "/" ? "" : path.startsWith("/") ? path : `/${path}`;
  const prefix = locale === defaultLocale ? "" : `/${locale}`;
  return `${DOMAIN}${prefix}${clean}` || `${DOMAIN}/`;
}

export interface Alternates {
  canonical: string;
  languages: Record<string, string>;
}

/**
 * 生成 metadata.alternates。
 * @param path   无 locale 前缀的页面路径，如 "/blog/news"
 * @param locale 当前页面 locale（canonical 指向它）
 */
export function buildAlternates(path: string, locale: string): Alternates {
  const languages: Record<string, string> = {};
  locales.forEach((loc: string) => {
    languages[loc] = localizedUrl(path, loc);
  });
  // x-default 指向默认语言版本，供未匹配语言的用户兜底
  languages["x-default"] = localizedUrl(path, defaultLocale);

  return {
    canonical: localizedUrl(path, locale),
    languages,
  };
}
