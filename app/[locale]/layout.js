import React, { Suspense } from "react";

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
import languageSettings from "@/config/languageSettings";
// import { cookies } from "next/headers";

// [locale] 段在构建期可枚举，配合 generateStaticParams 完全预渲染
export function generateStaticParams() {
  return languageSettings.locales.map((locale) => ({ locale }));
}

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
 * 获取布局数据。传统 ISR：不再用 'use cache'，
 * 缓存语义下沉到 getConfigData 内各 fetch 的 next:{tags,revalidate}。
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
      "common.footer_nav"
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
  // const cookieStore = await cookies();
  // const area = cookieStore.get("area")?.value || "us";
  const area = "us";
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
          <Suspense fallback={null}>
            <GoogleOneTap />
          </Suspense>
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
            <div id="app-content">
              <Suspense fallback={null}>{children}</Suspense>
            </div>
            <Footer />
          </Layout>
        </GoogleAuthProvider>
      </body>
    </html>
  );
}
