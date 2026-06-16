/** @format */

import React from "react";
import styles from "./page.module.scss";
import getConfigData from "../../../../utils/getConfigData";
import getBlogDetail from "@/config/Api/getBlogDetail";
import Banner from "./components/Banner";
import ArticleInfo from "./components/ArticleInfo";
import ArticleNav from "./components/ArticleNav";
import AssociateArticle from "./components/AssociateArticle";
import IdJson from "./components/IdJson";
import BaseLayout from "../../components/BaseLayout";

import ProductModal from "./components/ProductModal";
import { buildAlternates } from "@/config/seo";
import "@/styles/richtext.scss";

// 构建期枚举所有 (locale, sortKey, blogKey) 预生成文章页；
// 接口失败则构建失败；未列出的 slug 仍按需生成（dynamicParams 默认 true）。
export async function generateStaticParams() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_HOST}/config/getBlogPaths`);
  if (!res.ok) {
    throw new Error(`getBlogPaths 失败: HTTP ${res.status}`);
  }
  const json = await res.json();
  return (json?.data?.list || []).map(({ locale, sortKey, blogKey }) => ({
    locale,
    sortKey,
    blogKey,
  }));
}

// 文章详情走 getBlogDetail（按 slug fetch + tag），与全站 config/language 解耦。
// blogSortList 用于顶部 BaseLayout，来自 getBlogData 的 "sort" 命名空间。
// 不再读取 area cookie —— 关联商品保留完整 areaList，选价下沉到客户端 ProductModal。
const getData = async function ({ locale, blogKey, sortKey }) {
  const [{ BLOG, CONFIG, LANG }, blogArticle] =
    await Promise.all([
      getConfigData({
        locale,
        configList: ["blog", "config", "language"],
        blogNameSpace: ["sort"],
        configNameSpace: ["common.base"],
        languageNameSpace: [
          "store.blog_index.all",
          "store.blog_index.title",
          "store.blog_index.related_products",
          "store.product.off",
          "store.product.no_stock",
          "store.product.reviews",
        ],
      }),
      getBlogDetail({ locale, sortKey, blogKey }),
    ]);

  const blogSortList = Object.keys(BLOG?.sort || {})
    .map((key) => BLOG.sort[key])
    .sort((a, b) => b.weight - a.weight);

  return {
    blogSortList,
    blogArticle,
    CONFIG,
    LANG,
    // GOODDISCOUNTFESTIVAL,
  };
};

export async function generateMetadata({ params }) {
  const { locale, blogKey, sortKey } = await params;
  const { blogArticle } = await getData({ locale, blogKey, sortKey });
  if (!blogArticle) {
    return { title: "" };
  }
  const title = blogArticle.page_title;
  const description = blogArticle.page_description;
  const keywords = blogArticle.page_keywords;

  return {
    title,
    description,
    keywords,
    alternates: buildAlternates(`/blog/${sortKey}/${blogKey}`, locale),
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [blogArticle.image],
    },
    openGraph: {
      title,
      description,
      images: [
        {
          url: blogArticle.image,
          width: 746,
          height: 420,
        },
      ],
    },
  };
}

export default async function Article({ params }) {
  const { locale, blogKey, sortKey } = await params;
  const { CONFIG, LANG, blogSortList, blogArticle } =
    await getData({ locale, blogKey, sortKey });

  if (!blogArticle) return null;

  return (
    <>
      <BaseLayout blogSortList={blogSortList} sortKey={sortKey} LANG={LANG} />
      <div className={styles.container}>
        <IdJson CONFIG={CONFIG} article={blogArticle} />
        <div className={styles.flex_container}>
          {/* 导航栏 */}
          <ArticleNav titleList={blogArticle.titleList} />
          {/* 内容区 */}
          <div className={styles.flex_right}>
            <Banner article={blogArticle} />
            <div className={styles.content_container}>
              <h1 className={styles.title}>{blogArticle.title}</h1>
              <ArticleInfo article={blogArticle} locale={locale} />
              <div
                id="blog-article-content-html"
                className="wangeditor-rich-text-css"
                dangerouslySetInnerHTML={{
                  __html: blogArticle.content,
                }}
              />
            </div>
          </div>
        </div>
      </div>
      {/* 关联文章 */}
      {blogArticle.associateArticle?.length > 0 ? (
        <AssociateArticle articleList={blogArticle.associateArticle} />
      ) : null}
      {/* 关联产品 */}
      {blogArticle.associateProduct?.length > 0 ? (
        <ProductModal
          LANG={LANG}
          locale={locale}
          // goodDiscountFestival={GOODDISCOUNTFESTIVAL}
          productList={blogArticle.associateProduct}
        />
      ) : null}
    </>
  );
}
