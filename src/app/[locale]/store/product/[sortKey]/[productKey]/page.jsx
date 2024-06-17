import React from "react";

import GoodMainText from "./components/GoodMainText";
import GoodMediaDisplay from "./components/GoodMediaDisplay";
import GoodMediaTabs from "./components/GoodMediaTabs";
import GoodOptionList from "./components/GoodOptionList";
import GoodComboList from "./components/GoodComboList";
import AssociateProductList from "./components/AssociateProductList/index";
import GoodPackageList from "./components/GoodPackageList";
import GoodAccessoriesList from "./components/GoodAccessoriesList";
import GoodFunctionList from "./components/GoodFunctionList";
import GoodMediaList from "./components/GoodMediaList";
import GoodNumber from "./components/GoodNumber";
import GoodBtnList from "./components/GoodBtnList";
import Countdown from "./components/Countdown";

import GoodPrice from "./components/GoodPrice";
import GoodFooter from "./components/GoodFooter";
import GoodReviewsRate from "./components/GoodReviewsRate";
import GoodReviewsContent from "./components/GoodReviewsContent";

import GoodGuarantee from "./components/GoodGuarantee";
import GoodFaq from "./components/GoodFaq";

import GoodNav from "./components/GoodNav";

import styles from "./page.module.scss";

export const runtime = "edge";

export default async function Product() {
  return (
    <div className={styles.container}>
      <>
        <link rel="dns-prefetch" href="https://connect.facebook.net" />
        <link rel="dns-prefetch" href="https://www.paypal.com" />
        {/* 首屏信息配置 */}
        <section className={styles.main_content}>
          <div className={styles.left_content}>
            <GoodMediaDisplay />
            <Countdown />
            <GoodMediaTabs />
          </div>
          <div className={styles.right_content}>
            <div>
              {/* 主要文本 */}
              <GoodMainText />
              {/* 价格配置 */}
              <GoodPrice />
              {/* 产品评价 */}
              <GoodReviewsRate />
              <div className={styles.line}></div>
              {/* 产品套餐 */}
              <GoodComboList />
              {/* 产品选项 */}
              <GoodOptionList />
              {/* 产品数量 */}
              <GoodNumber />
              {/* 支付按钮 */}
              <GoodBtnList />
              {/* 产品保障 */}
              <GoodGuarantee />
            </div>
          </div>
        </section>
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
        {/* 关联产品列表 */}
        <AssociateProductList />
        {/* 产品底部 */}
        <GoodFooter />
        {/* <Script
            id="product-3d-script"
            defer
            type="module"
            src="https://ajax.googleapis.com/ajax/libs/model-viewer/3.3.0/model-viewer.min.js"
          ></Script> */}
      </>
    </div>
  );
}
