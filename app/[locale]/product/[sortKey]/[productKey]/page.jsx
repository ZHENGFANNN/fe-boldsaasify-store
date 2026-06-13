/** @format */

import React from "react";

import AssociateProductList from "./components/AssociateProductList/index";
import ProductLdJson from "./components/ProductLdJson";
import GoodPackageList from "./components/GoodPackageList";
import GoodAccessoriesList from "./components/GoodAccessoriesList";
import GoodFunctionList from "./components/GoodFunctionList";
import GoodMediaList from "./components/GoodMediaList";

import GoodFooter from "./components/GoodFooter";
import GoodReviewsContent from "./components/GoodReviewsContent";

import GoodFaq from "./components/GoodFaq";

import GoodNav from "./components/GoodNav";

import styles from "./page.module.scss";
import GoodMainLeft from "./components/GoodMainLeft";
import GoodMainRight from "./components/GoodMainRight";
import getProductPaths from "@/config/Api/getProductPaths";

export async function generateStaticParams() {
  return getProductPaths();
}

export default async function Product({ params }) {
  const { locale, sortKey, productKey } = await params;
  return (
    <div className={styles.container}>
      <>
        <link rel="dns-prefetch" href="https://connect.facebook.net" />
        <link rel="dns-prefetch" href="https://www.paypal.com" />
        {/* 首屏信息配置 */}
        <section className={styles.main_content}>
          <div className={styles.left_content}>
            <GoodMainLeft />
          </div>
          <div className={styles.right_content}>
            <GoodMainRight />
          </div>
        </section>
        {/* 关联产品列表 */}
        <AssociateProductList />
        <GoodNav />
        {/* 产品媒体列表 */}
        <GoodMediaList />
        {/* 产品功能 */}
        <GoodFunctionList />
        {/* 产品参数 */}
        <GoodAccessoriesList />
        {/* 产品包装列表 */}
        <GoodPackageList />
        {/* 产品FAQ */}
        <GoodFaq />
        {/* 产品评论 */}
        <GoodReviewsContent />
        {/* 产品底部 */}
        <GoodFooter />
        {/* <Script
            id="product-3d-script"
            defer
            type="module"
            src="https://ajax.googleapis.com/ajax/libs/model-viewer/3.3.0/model-viewer.min.js"
          ></Script> */}
        <ProductLdJson
          locale={locale}
          sortKey={sortKey}
          productKey={productKey}
        />
      </>
    </div>
  );
}
