/** @format */

import React from "react";
import getConfigData from "../../../utils/getConfigData";
import styles from "./page.module.scss";
import ArticleCard from "../components/ArticleCard";
import BaseLayout from "../components/BaseLayout";

export const runtime = "edge";

async function getData({ locale }) {
  const { LANG, BLOG } = await getConfigData({
    locale,
    configList: ["blog", "language"],
    blogNameSpace: ["sort"],
    languageNameSpace: ["store.blog_index.all", "store.blog_index.title"],
  });
  return { LANG, BLOG };
}

export async function generateMetadata({ params }) {
  const { locale, sortKey } = await params;
  const {
    BLOG: { sort },
  } = await getData({ locale });
  const currentBlogSort = sort[sortKey];
  const title = currentBlogSort.name;
  let descriptionList = [],
    twitterImageList = [],
    openGraphImageList = [],
    description = null;

  currentBlogSort.blogList.forEach((item) => {
    descriptionList.push(item.title);
    twitterImageList.push(item.image);
    openGraphImageList.push({
      url: item.image,
      width: 746,
      height: 420,
    });
  });
  description = descriptionList.join(",");
  return {
    title,
    description,
    keywords: description,
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

export default async function BlogSort({ params }) {
  const { locale, sortKey } = await params;
  const {
    LANG,
    BLOG: { sort: blogSortMap },
  } = await getData({ locale });
  const blogSortList = Object.keys(blogSortMap)
    .map((item) => {
      const blogSort = blogSortMap[item];
      return {
        weight: blogSort.weight,
        key: blogSort.key,
        name: blogSort.name,
      };
    })
    .sort((a, b) => b.weight - a.weight);
  const currentBlogSort = blogSortMap[sortKey];

  return (
    <>
      <BaseLayout blogSortList={blogSortList} sortKey={sortKey} LANG={LANG} />
      <div className={styles.container}>
        <BlogArticleCard blogSort={currentBlogSort} locale={locale} />
      </div>
    </>
  );
}
