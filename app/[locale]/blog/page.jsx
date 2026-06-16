/** @format */
import React from "react";
import getRemoteLanguage from "@/config/Api/getRemoteLanguage";
import getRemoteConfig from "@/config/Api/getRemoteConfig";
import { getBlogList } from "@/config/Api/getRemoteBlogList";
import getRemoteBlogBanner from "@/config/Api/getRemoteBlogBanner";
import styles from "./page.module.scss";
import ArticleCard from "./components/ArticleCard";
import BaseLayout from "./components/BaseLayout";
import Link from "next/link";
import Banner from "./components/Banner";
import { buildAlternates } from "@/config/seo";

// language / config / blog 列表 / banner 各走独立远程接口（不再经 getConfigData 聚合）。
async function getData({ locale }) {
  const [LANG, CONFIG, blogSortList, banner] = await Promise.all([
    getRemoteLanguage({
      locale,
      nameSpace: [
        "store.blog_index.view_all",
        "store.blog_index.all",
        "store.blog_index.title",
      ],
    }),
    getRemoteConfig({ locale, nameSpace: ["common.base"] }),
    getBlogList({ locale }),
    getRemoteBlogBanner({ locale }),
  ]);

  return { LANG, CONFIG, blogSortList, banner };
}

export async function generateMetadata({ params }) {
  const { locale } = await params;
  const { LANG, CONFIG, blogSortList, banner } = await getData({ locale });

  let twitterImageList = [],
    openGraphImageList = [];
  banner.forEach((item) => {
    twitterImageList.push(item.image);
    openGraphImageList.push({
      url: item.image,
      width: 746,
      height: 420,
    });
  });

  const title = `${CONFIG["common.base"]?.company_name} ${LANG["store.blog_index.title"]}`;
  const description = blogSortList.map((item) => item.name).join(",");

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
  const { LANG, blogSortList, banner } = await getData({ locale });
  return (
    <>
      <BaseLayout blogSortList={blogSortList} LANG={LANG} />
      {banner.length > 0 ? <Banner list={banner} /> : null}
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
