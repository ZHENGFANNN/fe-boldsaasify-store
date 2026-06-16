/** @format */

import React from "react";
import { notFound } from "next/navigation";
import getRemoteLanguage from "@/config/Api/getRemoteLanguage";
import { getBlogCategory } from "@/config/Api/getRemoteBlogList";
import styles from "./page.module.scss";
import ArticleCard from "../components/ArticleCard";
import BaseLayout from "../components/BaseLayout";
import { buildAlternates } from "@/config/seo";

// language 走远程接口；分类 + 该类文章 + 导航列表走 getBlogCategory（单独接口）。
async function getData({ locale, sortKey }) {
  const [LANG, blog] = await Promise.all([
    getRemoteLanguage({
      locale,
      nameSpace: ["store.blog_index.all", "store.blog_index.title"],
    }),
    getBlogCategory({ locale, sortKey }),
  ]);
  return { LANG, ...blog };
}

export async function generateMetadata({ params }) {
  const { locale, sortKey } = await params;
  const { category, blogList } = await getData({ locale, sortKey });
  if (!category) {
    return { title: "" };
  }
  const title = category.name;
  let descriptionList = [],
    twitterImageList = [],
    openGraphImageList = [];

  blogList.forEach((item) => {
    descriptionList.push(item.title);
    twitterImageList.push(item.image);
    openGraphImageList.push({
      url: item.image,
      width: 746,
      height: 420,
    });
  });
  const description = descriptionList.join(",");
  return {
    title,
    description,
    keywords: description,
    alternates: buildAlternates(`/blog/${sortKey}`, locale),
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: twitterImageList,
    },
    openGraph: {
      title,
      description,
      images: openGraphImageList,
    },
  };
}

function BlogArticleCard({ category, blogList, locale }) {
  return (
    <div className={styles.sort_container}>
      <h2 className={styles.sort_title}>{category.name}</h2>
      <div className={styles.article_container}>
        {blogList.map((item, index) => {
          return <ArticleCard item={item} locale={locale} key={index} />;
        })}
      </div>
    </div>
  );
}

export default async function BlogSort({ params }) {
  const { locale, sortKey } = await params;
  const { LANG, category, blogList, categories } = await getData({
    locale,
    sortKey,
  });

  // 分类不存在 → 404
  if (!category) {
    notFound();
  }

  // 顶部导航列表（按 weight 降序，仅 key/name/weight）
  const blogSortList = [...categories].sort((a, b) => b.weight - a.weight);

  return (
    <>
      <BaseLayout blogSortList={blogSortList} sortKey={sortKey} LANG={LANG} />
      <div className={styles.container}>
        <BlogArticleCard
          category={category}
          blogList={blogList}
          locale={locale}
        />
      </div>
    </>
  );
}
