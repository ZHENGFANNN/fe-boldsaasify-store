/** @format */

import React from "react";
import getConfigData from "@/utils/getConfigData";
import styles from "./page.module.scss";
import ArticleCard from "./components/ArticleCard";
import BaseLayout from "./components/BaseLayout";
import Link from "next/link";

export async function generateMetadata({ params: { locale, sortKey } }) {
  const { BLOG } = await getConfigData({
    locale,
    configList: ["blog"],
  });
  return {
    title: "sslfly Blog",
    description: BLOG.map((item) => item.name).join(","),
    keywords: BLOG.map((item) => item.name).join(","),
    twitter: {
      card: "summary_large_image",
      title: "sslfly Blog",
      description: BLOG.map((item) => item.name).join(","),
      images: BLOG[0].blogList.map((item) => item.image),
    },
    openGraph: {
      title: "sslfly Blog",
      description: BLOG.map((item) => item.name).join(","),
      images: BLOG[0].blogList.map((item) => {
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
          if (index >= 6) return null;
          return <ArticleCard item={item} locale={locale} key={index} />;
        })}
      </div>
      {blogSort.blogList.length > 6 ? (
        <div className={styles.btn_container}>
          <Link href={`/blog/${blogSort.key}`} className={styles.btn_text}>
            View All
          </Link>
        </div>
      ) : null}
    </div>
  );
}

export default async function BlogSort({ params: { locale } }) {
  const { BLOG } = await getConfigData({
    locale,
    configList: ["blog"],
  });
  return (
    <BaseLayout BLOG={BLOG}>
      <div className={styles.container}>
        {BLOG.map((item, index) => {
          return (
            <BlogArticleCard key={index} blogSort={item} locale={locale} />
          );
        })}
      </div>
    </BaseLayout>
  );
}
