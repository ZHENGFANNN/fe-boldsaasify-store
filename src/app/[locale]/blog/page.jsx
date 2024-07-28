/** @format */
import React from "react";
import getConfigData from "@/utils/getConfigData";
import styles from "./page.module.scss";
import ArticleCard from "./components/ArticleCard";
import BaseLayout from "./components/BaseLayout";
import Link from "next/link";
import Banner from "./components/Banner";

export const runtime = "edge";

export async function generateMetadata({ params: { locale } }) {
  const {
    LANG,
    CONFIG,
    BLOG: { blogSortMap, blogBannerList },
  } = await getConfigData({
    locale,
    configList: ["blog", "config", "language"],
    configNameSpace: ["company.basic.company_name"],
    languageNameSpace: ["store.blog_index.title"],
  });

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
  } = await getConfigData({
    locale,
    configList: ["blog", "language"],
    languageNameSpace: [
      "store.blog_index.view_all",
      "store.blog_index.all",
      "store.blog_index.title",
    ],
  });
  const bannerList = blogBannerList.map((item) => {
    return {
      image: item.image,
      title: item.title,
      key: item.key,
      sort_key: item.sort_key,
    };
  });
  const blogSortList = Object.keys(blogSortMap)
    .map((item) => {
      const blogSort = blogSortMap[item];
      return {
        weight: blogSort.weight,
        key: blogSort.key,
        name: blogSort.name,
        blogList: blogSort.blogList.map((item) => {
          return {
            image: item.image,
            title: item.title,
            key: item.key,
            sort_key: item.sort_key,
            updated_time: item.updated_time,
          };
        }),
      };
    })
    .sort((a, b) => b.weight - a.weight);

  return (
    <>
      <BaseLayout blogSortList={blogSortList} LANG={LANG} />
      {blogBannerList.length > 0 ? <Banner list={bannerList} /> : null}
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
