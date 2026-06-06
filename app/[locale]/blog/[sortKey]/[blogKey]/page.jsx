/** @format */

import React from "react";
import styles from "./page.module.scss";
import getConfigData from "../../../../utils/getConfigData";
import Banner from "./components/Banner";
import ArticleInfo from "./components/ArticleInfo";
import ArticleNav from "./components/ArticleNav";
import AssociateArticle from "./components/AssociateArticle";
import IdJson from "./components/IdJson";
import BaseLayout from "../../components/BaseLayout";

import ProductModal from "./components/ProductModal";
import { cookies } from "next/headers";
import "@/styles/richtext.scss";

const getData = async function ({ area, locale, blogKey, sortKey }) {
  const articleKey = `article:${sortKey}:${blogKey}`;
  const { BLOG, CONFIG, LANG, GOODDISCOUNTFESTIVAL } = await getConfigData({
    area,
    locale,
    configList: ["blog", "config", "language", "goodDiscountFestival"],
    blogNameSpace: ["sort", articleKey],
    configNameSpace: [
      "company.basic.company_name",
      "company.basic.customer_service",
    ],
    languageNameSpace: [
      "store.blog_index.all",
      "store.blog_index.title",
      "store.blog_index.related_products",
      "store.product.off",
      "store.product.no_stock",
      "store.product.reviews",
    ],
  });
  // 处理文章
  const blogSortList = Object.keys(BLOG.sort)
    .map((key) => BLOG.sort[key])
    .sort((a, b) => b.weight - a.weight);
  BLOG.blogSortList = blogSortList;
  const blogArticle = BLOG[articleKey];
  BLOG.blogArticle = blogArticle;
  BLOG.blogSortList = blogSortList;
  delete BLOG.sort;

  return {
    BLOG,
    CONFIG,
    LANG,
    GOODDISCOUNTFESTIVAL,
  };
};

export async function generateMetadata({ params }) {
  const { locale, blogKey, sortKey } = await params;
  const cookieStore = await cookies();
  const area = cookieStore.get("area")?.value || "us";
  const { BLOG } = await getData({
    area,
    locale,
    blogKey,
    sortKey,
  });
  const title = BLOG.blogArticle.page_title;
  const description = BLOG.blogArticle.page_description;
  const keywords = BLOG.blogArticle.page_keywords;

  return {
    title,
    description,
    keywords,
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [BLOG.blogArticle.image], // Must be an absolute URL
    },
    openGraph: {
      title,
      description,
      images: [
        {
          url: BLOG.blogArticle.image, // Must be an absolute URL
          width: 746,
          height: 420,
        },
      ],
    },
  };
}

export default async function Article({ params }) {
  const { locale, blogKey, sortKey } = await params;
  const cookieStore = await cookies();
  const area = cookieStore.get("area")?.value || "us";
  const { CONFIG, LANG, BLOG, GOODDISCOUNTFESTIVAL } = await getData({
    area,
    locale,
    blogKey,
    sortKey,
  });
  return (
    <>
      <BaseLayout
        blogSortList={BLOG.blogSortList}
        sortKey={sortKey}
        LANG={LANG}
      />
      <div className={styles.container}>
        <IdJson CONFIG={CONFIG} article={BLOG.blogArticle} />
        <div className={styles.flex_container}>
          {/* 导航栏 */}
          <ArticleNav titleList={BLOG.blogArticle.titleList} />
          {/* 内容区 */}
          <div className={styles.flex_right}>
            <Banner article={BLOG.blogArticle} />
            <div className={styles.content_container}>
              <h1 className={styles.title}>{BLOG.blogArticle.title}</h1>
              <ArticleInfo article={BLOG.blogArticle} locale={locale} />
              <div
                id="blog-article-content-html"
                className="wangeditor-rich-text-css"
                dangerouslySetInnerHTML={{
                  __html: BLOG.blogArticle.content,
                }}
              />
            </div>
          </div>
        </div>
      </div>
      {/* 关联文章 */}
      {BLOG.blogArticle.associateArticle.length > 0 ? (
        <AssociateArticle articleList={BLOG.blogArticle.associateArticle} />
      ) : null}
      {/* 关联产品 */}
      {BLOG.blogArticle.associateProduct?.length > 0 ? (
        <ProductModal
          LANG={LANG}
          locale={locale}
          goodDiscountFestival={GOODDISCOUNTFESTIVAL}
          productList={BLOG.blogArticle.associateProduct}
        />
      ) : null}
    </>
  );
}
