/** @format */

import React from "react";

import { languageList } from "../../../../config/LANGUAGE";

import AssociateProductList from "./components/AssociateProductList/index";
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

// 兜底重新验证周期（秒）；实时刷新靠 /api/revalidate 的 on-demand tag。
export const revalidate = 86400;

// 构建期枚举所有 (locale, sortKey, productKey)，预生成商品页；
// 未列出的 slug 仍按需 ISR（dynamicParams 默认 true）。
export async function generateStaticParams() {
  const fs = await import("node:fs");
  const path = await import("node:path");
  const params = [];
  for (const lang of languageList) {
    const locale = lang.value;
    const file = path.join(
      process.cwd(),
      "public",
      "config",
      "product",
      "sort",
      `${locale}.json`
    );
    let data;
    try {
      data = JSON.parse(fs.readFileSync(file, "utf8"));
    } catch {
      continue;
    }
    Object.keys(data || {}).forEach((sortKey) => {
      (data[sortKey]?.goodList || []).forEach((good) => {
        if (good?.sort_key && good?.key) {
          params.push({ locale, sortKey: good.sort_key, productKey: good.key });
        }
      });
    });
  }
  return params;
}

export default async function Product() {
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
      </>
    </div>
  );
}
