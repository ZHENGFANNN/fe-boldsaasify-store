/** @format */

import "../styles/globals.css";
import "../styles/reset.css";

import Navbar from "../components/Layout/NavBar";
import Footer from "../components/Layout/Footer";

import React from "react";
import Layout from "../components/Layout";

import getConfigData from "../utils/getConfigData";
import { cookies } from "next/headers";

// Meta - viewport
export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  minimumScale: 1,
  userScalable: "no",
  appleMobileWebAppCapable: "yes",
};

/**
 * 获取数据
 */
async function getData({ locale, area }) {
  const result = await getConfigData({
    locale,
    area,
    configList: [
      "config",
      "language",
      "goodSort",
      "blog",
      "good",
      "product",
      "goodDiscountFestival",
    ],
    languageNameSpace: [
      "common.nav",
      "common.cart",
      "common.footer",
      "common.other",
    ],
    configNameSpace: [
      "company.basic",
      "company.sales_channels.index",
      "company.social_media.index",
    ],
    blogNameSpace: ["layout"],
    productNameSpace: ["layout", "sort"],
  });

  const productList = [];

  result.PRODUCT.sort.forEach((item) => {
    return productList.push(...item.goodList);
  });

  result.PRODUCT.cart = productList.map((item) => ({
    key: item.key,
    name: item.name,
    sort_key: item.sort_key,
    image: item.image,
    comboList: item.comboList.map(
      ({ img_list, smart_img, description, ...combo }) => combo
    ),
  }));

  return result;
}

export default async function RootLayout(props) {
  const { children, params } = props;
  const { locale } = await params;
  const cookieStore = await cookies();
  const area = cookieStore.get("area")?.value || "us";
  const { CONFIG, LANG, GOODDISCOUNTFESTIVAL, BLOG, PRODUCT } = await getData({
    locale,
    area,
  });

  return (
    <html lang={locale}>
      <head>
        {/* website Logo */}
        <link rel="icon" href={CONFIG["company.basic.logo"]} />
      </head>
      <body>
        <Layout
          locale={locale}
          area={area}
          LANG={LANG}
          BLOG={BLOG}
          CONFIG={CONFIG}
          PRODUCT={PRODUCT}
          goodDiscountFestival={GOODDISCOUNTFESTIVAL}
        >
          <Navbar />
          <div id="app-content">{children}</div>
          <Footer />
        </Layout>
      </body>
    </html>
  );
}
