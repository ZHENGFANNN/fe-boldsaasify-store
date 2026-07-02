/** @format */

import { notFound } from "next/navigation";
import styles from "./page.module.scss";
import getArticleDetail from "@/config/Api/getArticleDetail";
import getArticlePaths from "@/config/Api/getArticlePaths";
import { buildAlternates } from "@/config/seo";
import { formateTime } from "../../../blog/utils";
import "@/styles/richtext.scss";

// 构建期枚举所有 (locale, sortKey, articleKey) 预生成文章页（对齐 blog getBlogPaths）；
// 接口失败返回空数组（getArticlePaths 内部已容错），未列出的 slug 仍按需生成。
export async function generateStaticParams() {
  return getArticlePaths();
}

async function getData({ locale, sortKey, articleKey }) {
  const article = await getArticleDetail({ locale, sortKey, articleKey });
  return { article };
}

export async function generateMetadata({ params }) {
  const { locale, sortKey, articleKey } = await params;
  const { article } = await getData({ locale, sortKey, articleKey });
  if (!article) {
    return { title: "" };
  }
  return {
    title: article.page_title || article.title,
    description: article.page_description,
    keywords: article.page_keywords,
    alternates: buildAlternates(`/article/${sortKey}/${articleKey}`, locale),
  };
}

export default async function ArticlePage({ params }) {
  const { locale, sortKey, articleKey } = await params;
  const { article } = await getData({ locale, sortKey, articleKey });

  if (!article) notFound();

  return (
    <div className={styles.container}>
      <div className={styles.content_container}>
        <div className={styles.content_title}>{article.title}</div>
        <div className={styles.meta}>
          {formateTime({ time: article.updated_time, locale })}
        </div>
        <div className={styles.content_line}></div>
        <div className={styles.content}>
          <div
            className="wangeditor-rich-text-css"
            dangerouslySetInnerHTML={{ __html: article.content }}
          />
        </div>
      </div>
    </div>
  );
}
