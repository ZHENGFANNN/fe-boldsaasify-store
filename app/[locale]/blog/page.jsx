/** @format */
import React from "react";
import getConfigData from "../../utils/getConfigData";
import getRemoteBlogBanner from "@/config/Api/getRemoteBlogBanner";
import styles from "./page.module.scss";
import ArticleCard from "./components/ArticleCard";
import BaseLayout from "./components/BaseLayout";
import Link from "next/link";
import Banner from "./components/Banner";
import { buildAlternates } from "@/config/seo";

async function getData({ locale }) {
  const [{ LANG, BLOG, CONFIG }, banner] = await Promise.all([
    getConfigData({
      locale,
      configList: ["blog", "config", "language"],
      configNameSpace: ["common.base"],
      blogNameSpace: ["sort"],
      languageNameSpace: [
        "store.blog_index.view_all",
        "store.blog_index.all",
        "store.blog_index.title",
      ],
    }),
    getRemoteBlogBanner({ locale }),
  ]);

  // banner 改独立接口取（不再混进 getConfigData / 布局聚合）
  BLOG.banner = banner;

  // 处理Blog
  const { sort: blogSort } = BLOG;
  const blogSortList = Object.keys(blogSort)
    .map((key) => blogSort[key])
    .sort((a, b) => b.weight - a.weight);
  BLOG.blogSortList = blogSortList;

  return { LANG, BLOG, CONFIG };
}

export async function generateMetadata({ params }) {
  const { locale } = await params;
  const { LANG, CONFIG, BLOG } = await getData({ locale });

  let twitterImageList = [],
    openGraphImageList = [];
  BLOG.banner.forEach((item) => {
    twitterImageList.push(item.image);
    openGraphImageList.push({
      url: item.image,
      width: 746,
      height: 420,
    });
  });

  const title = `${CONFIG["common.base"]?.company_name} ${LANG["store.blog_index.title"]}`;
  const description = BLOG.blogSortList.map((item) => item.name).join(",");

  return {
    title,
    description,
    keywords: description,
    alternates: buildAlternates("/blog", locale),
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

export default async function BlogSort({ params }) {
  const { locale } = await params;
  const { LANG, BLOG } = await getData({ locale });
  return (
    <>
      <BaseLayout blogSortList={BLOG.blogSortList} LANG={LANG} />
      {BLOG.banner.length > 0 ? <Banner list={BLOG.banner} /> : null}
      <div className={styles.container}>
        {BLOG.blogSortList.map((item, index) => {
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
