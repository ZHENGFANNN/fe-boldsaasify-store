/** @format */

import React from "react";
import styles from "./page.module.scss";
import getConfigData from "@/utils/getConfigData";
import Banner from "./components/Banner";
import ArticleInfo from "./components/ArticleInfo";
import ArticleNav from "./components/ArticleNav";
import AssociateArticle from "./components/AssociateArticle";
import { getHeadTitleList, addHeadTitleId } from "../../utils";
import IdJson from "./components/IdJson";
import BaseLayout from "../../components/BaseLayout";

import ProductModal from "./components/ProductModal";
import { cookies } from "next/headers";

function handleShowProductList({ productList, area }) {
  productList = productList.map(
    ({
      reviewsList,
      image_list,
      comboList,
      reviews_num,
      reviews_score,
      ...item
    }) => {
      let areaInfo = null;
      comboList.find((combo) => {
        combo.areaList.find((area_item) => {
          if (area_item.country_code === area) {
            areaInfo = area_item;
          }
          return area_item.country_code === area;
        });
        return areaInfo?.stock;
      });

      const totalScore = reviewsList.reduce((pre, cur) => pre + cur.score, 0);
      item.reviewScore = totalScore / reviewsList.length || reviews_score;
      item.reviewsNum = reviewsList.length || reviews_num;
      item.image = image_list[0].src;
      item.areaInfo = areaInfo;

      return item;
    }
  );
  return productList;
}

const getData = async function ({
  area,
  locale,
  blogKey,
  sortKey,
  configList,
  configNameSpace,
}) {
  const { BLOG, CONFIG, LANG, GOODDISCOUNTFESTIVAL } = await getConfigData({
    locale,
    configNameSpace,
    configList,
  });
  // 文章分类
  const blogSort = BLOG.find((item) => item.key === sortKey);
  // 找到当前文章
  const blogArticle = blogSort.blogList.find((item) => item.key === blogKey);
  // 处理文章标题
  blogArticle.content = addHeadTitleId(blogArticle.content);
  const headTitleList = getHeadTitleList(blogArticle.content);
  // 处理文章相关产品
  if (blogArticle.associateProduct.length > 0) {
    blogArticle.products = handleShowProductList({
      productList: blogArticle.associateProduct,
      area,
    });
  }

  return {
    BLOG,
    blogSort,
    blogArticle,
    headTitleList,
    CONFIG,
    LANG,
    GOODDISCOUNTFESTIVAL,
  };
};

export async function generateMetadata({
  params: { locale, blogKey, sortKey },
}) {
  const { blogArticle } = await getData({
    locale,
    blogKey,
    sortKey,
    configList: ["blog"],
  });
  return {
    title: blogArticle.page_title,
    description: blogArticle.page_description,
    keywords: blogArticle.page_keywords,
    twitter: {
      card: "summary_large_image",
      title: blogArticle.page_title,
      description: blogArticle.page_description,
      images: [blogArticle.image], // Must be an absolute URL
    },
    openGraph: {
      title: blogArticle.page_title,
      description: blogArticle.page_description,
      images: [
        {
          url: blogArticle.image, // Must be an absolute URL
          width: 746,
          height: 420,
        },
      ],
    },
  };
}

export default async function Article({
  params: { locale, blogKey, sortKey },
}) {
  const area = cookies().get("area")?.value || "us";
  const {
    blogSort,
    blogArticle,
    headTitleList,
    CONFIG,
    LANG,
    BLOG,
    GOODDISCOUNTFESTIVAL,
  } = await getData({
    area,
    locale,
    blogKey,
    sortKey,
    configList: ["blog", "config", "language", "goodDiscountFestival"],
    configNameSpace: [
      "company.basic.company_name",
      "company.basic.customer_service",
    ],
  });
  return (
    <BaseLayout BLOG={BLOG} sortKey={sortKey}>
      <div className={styles.container}>
        <IdJson CONFIG={CONFIG} article={blogArticle} />
        <div className={styles.flex_container}>
          {/* 导航栏 */}
          <ArticleNav headTitleList={headTitleList} />
          {/* 内容区 */}
          <div className={styles.flex_right}>
            <Banner article={blogArticle} />
            <div className={styles.content_container}>
              <h1 className={styles.title}>{blogArticle.title}</h1>
              <ArticleInfo
                article={blogArticle}
                sort={blogSort}
                locale={locale}
              />
              <div
                id="blog-article-content-html"
                className={styles.content}
                dangerouslySetInnerHTML={{
                  __html: blogArticle.content,
                }}
              />
            </div>
          </div>
        </div>
      </div>
      {/* 关联文章 */}
      {blogArticle.associateArticle.length > 0 ? (
        <AssociateArticle articleList={blogArticle.associateArticle} />
      ) : null}
      {/* 关联产品 */}
      {blogArticle.associateProduct?.length > 0 ? (
        <ProductModal
          LANG={LANG}
          goodDiscountFestival={GOODDISCOUNTFESTIVAL}
          productList={blogArticle.products}
          locale={locale}
        />
      ) : null}
    </BaseLayout>
  );
}
