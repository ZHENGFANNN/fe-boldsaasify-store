/** @format */
import React from "react";
import getConfigData from "@/utils/getConfigData";
import styles from "./page.module.scss";
import ArticleCard from "./components/ArticleCard";
import BaseLayout from "./components/BaseLayout";
import Link from "next/link";
import Banner from "./components/Banner";

export const runtime = "edge";

async function getData({ locale }) {
  const { LANG, BLOG, CONFIG } = await getConfigData({
    locale,
    configList: ["blog", "config", "language"],
    configNameSpace: ["company.basic.company_name"],
    languageNameSpace: [
      "store.blog_index.view_all",
      "store.blog_index.all",
      "store.blog_index.title",
    ],
  });
  return { LANG, BLOG, CONFIG };
}

export async function generateMetadata({ params: { locale } }) {
  const {
    LANG,
    CONFIG,
    BLOG: { blogSortMap, blogBannerList },
  } = await getData({ locale });

  const blogSortList = Object.keys(blogSortMap)
    .map((item) => blogSortMap[item])
    .sort((a, b) => b.weight - a.weight);

  let twitterImageList = [],
    openGraphImageList = [];
  blogBannerList.forEach((item) => {
    twitterImageList.push(item.image);
    openGraphImageList.push({
      url: item.image,
      width: 746,
      height: 420,
    });
  });

  const title = `${CONFIG["company.basic.company_name"]} ${LANG["store.blog_index.title"]}`;
  const description = blogSortList.map((item) => item.name).join(",");

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

function BlogArticleCard({ blogSort, locale, LANG }) {
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
          <Link
            scroll={true}
            href={`/blog/${blogSort.key}`}
            className={styles.btn_text}
          >
            {LANG["store.blog_index.view_all"]}
          </Link>
        </div>
      ) : null}
    </div>
  );
}

export default async function BlogSort({ params: { locale } }) {
  const {
    LANG,
    BLOG: { blogSortMap, blogBannerList },
  } = await getData({ locale });
  const blogSortList = Object.keys(blogSortMap)
    .map((item) => blogSortMap[item])
    .sort((a, b) => b.weight - a.weight);

  return (
    <>
      <BaseLayout blogSortList={blogSortList} LANG={LANG} />
      {blogBannerList.length > 0 ? <Banner list={blogBannerList} /> : null}
      <div className={styles.container}>
        {blogSortList.map((item, index) => {
          return (
            <BlogArticleCard
              LANG={LANG}
              key={index}
              blogSort={item}
              locale={locale}
            />
          );
        })}
      </div>
    </>
  );
}
