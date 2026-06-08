import React from "react";

import "@/styles/globals.css";
import "@/styles/reset.css";

import Layout from "@/components/Layout";
import Navbar from "@/components/Layout/NavBar";
import Footer from "@/components/Layout/Footer";
import { GTMNoScript } from "@/components/Head/GTM";

import Head from "@/components/Head";
import GoogleAuthProvider from "@/components/GoogleAuth";
import GoogleOneTap from "@/components/GoogleAuth/GoogleOneTap";

import getConfigData from "@/utils/getConfigData";
import { cookies } from "next/headers";

// Meta - viewport
export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  minimumScale: 1,
  userScalable: "no",
  appleMobileWebAppCapable: "yes"
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
      "goodDiscountFestival"
    ],
    languageNameSpace: [
      "common.nav",
      "common.cart",
      "common.footer",
      "common.other",
      "common.contact",
      "common.cookie"
    ],
    configNameSpace: [
      "common.base",
      "common.social",
      "common.top_bar",
      "common.footer_nav",
    ],
    blogNameSpace: ["layout"],
    productNameSpace: ["layout", "sort"]
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
    )
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
    area
  });

  return (
    <html lang={locale}>
      <Head logoLink={CONFIG["common.base"]?.logo} />
      <body>
        <GTMNoScript />
        <GoogleAuthProvider>
          <GoogleOneTap />
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
        </GoogleAuthProvider>
      </body>
    </html>
  );
}
