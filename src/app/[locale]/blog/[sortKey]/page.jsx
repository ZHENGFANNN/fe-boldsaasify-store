/** @format */

import React from "react";
import getConfigData from "@/utils/getConfigData";
import styles from "./page.module.scss";
import ArticleCard from "../components/ArticleCard";
import BaseLayout from "../components/BaseLayout";

export async function generateMetadata({ params: { locale, sortKey } }) {
  const { BLOG } = await getConfigData({
    locale,
    configList: ["blog"],
  });
  const currentBlogSort = BLOG.find((item) => item.key === sortKey);
  return {
    title: currentBlogSort.name,
    description: currentBlogSort.blogList.map((item) => item.title).join(","),
    keywords: currentBlogSort.blogList.map((item) => item.title).join(","),
    twitter: {
      card: "summary_large_image",
      title: currentBlogSort.name,
      description: currentBlogSort.blogList.map((item) => item.title).join(","),
      images: currentBlogSort.blogList.map((item) => item.image),
    },
    openGraph: {
      title: currentBlogSort.name,
      description: currentBlogSort.blogList.map((item) => item.title).join(","),
      images: currentBlogSort.blogList.map((item) => {
        return {
          url: item.image,
          width: 746,
          height: 420,
        };
      }),
    },
  };
}

function BlogArticleCard({ blogSort, locale }) {
  return (
    <div className={styles.sort_container}>
      <h2 className={styles.sort_title}>{blogSort.name}</h2>
      <div className={styles.article_container}>
        {blogSort.blogList.map((item, index) => {
          return <ArticleCard item={item} locale={locale} key={index} />;
        })}
      </div>
    </div>
  );
}

export default async function BlogSort({ params: { locale, sortKey } }) {
  const { BLOG } = await getConfigData({
    locale,
    configList: ["blog"],
  });
  const currentBlogSort = BLOG.find((item) => item.key === sortKey);
  return (
    <BaseLayout BLOG={BLOG} sortKey={sortKey}>
      <div className={styles.container}>
        <BlogArticleCard blogSort={currentBlogSort} locale={locale} />
      </div>
    </BaseLayout>
  );
}
