/** @format */

import React from "react";
import styles from "./page.module.scss";
import getRemoteLanguage from "@/config/Api/getRemoteLanguage";
import getRemoteConfig from "@/config/Api/getRemoteConfig";
import { getBlogCategory } from "@/config/Api/getRemoteBlogList";
import getBlogDetail from "@/config/Api/getBlogDetail";
import getBlogPaths from "@/config/Api/getBlogPaths";
import Banner from "./components/Banner";
import ArticleInfo from "./components/ArticleInfo";
import ArticleNav from "./components/ArticleNav";
import AssociateArticle from "./components/AssociateArticle";
import IdJson from "./components/IdJson";
import BaseLayout from "../../components/BaseLayout";

import ProductModal from "./components/ProductModal";
import { buildAlternates } from "@/config/seo";
import "@/styles/richtext.scss";

// 构建期枚举所有 (locale, sortKey, blogKey) 预生成文章页（与产品页 getProductPaths 同模式）；
// 接口失败返回空数组（getBlogPaths 内部已容错），未列出的 slug 仍按需生成（dynamicParams 默认 true）。
export async function generateStaticParams() {
  return getBlogPaths();
}

// 文章详情走 getBlogDetail（按 slug fetch + tag）；language/config 走独立远程接口；
// 顶部 BaseLayout 的分类导航走 getBlogCategory 的 categories。
// 不再读取 area cookie —— 关联商品保留完整 areaList，选价下沉到客户端 ProductModal。
const getData = async function ({ locale, blogKey, sortKey }) {
  const [LANG, CONFIG, blog, blogArticle] = await Promise.all([
    getRemoteLanguage({
      locale,
      nameSpace: [
        "store.blog_index.all",
        "store.blog_index.title",
        "store.blog_index.related_products",
        "store.product.off",
        "store.product.no_stock",
        "store.product.reviews",
      ],
    }),
    getRemoteConfig({ locale, nameSpace: ["common.base"] }),
    getBlogCategory({ locale, sortKey }),
    getBlogDetail({ locale, sortKey, blogKey }),
  ]);

  const blogSortList = [...(blog.categories || [])].sort(
    (a, b) => b.weight - a.weight
  );

  return {
    blogSortList,
    blogArticle,
    CONFIG,
    LANG,
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
