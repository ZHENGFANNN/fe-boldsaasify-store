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
import getRemoteLanguage from "@/config/Api/getRemoteLanguage";
import getRemoteConfig from "@/config/Api/getRemoteConfig";
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

// 布局多语言/页面配置命名空间（各接口独立拉取，互不耦合）。
const LANG_NAMESPACE = [
  "common.nav",
  "common.cart",
  "common.footer",
  "common.other",
  "common.contact",
  "common.cookie"
];
const CONFIG_NAMESPACE = [
  "common.base",
  "common.social",
  "common.top_bar",
  "common.footer_nav"
];

/**
 * 获取布局数据。传统 ISR：不再用 'use cache'，
 * 缓存语义下沉到各 fetch 的 next:{tags,revalidate}。
 *
 * LANG / CONFIG 改走独立按命名空间接口（getRemoteLanguage / getRemoteConfig，
 * 后端整形 + TTL，前端开箱即用），不再经 getConfigData 转发；
 * BLOG / PRODUCT / 折扣节仍由 getConfigData 聚合。
 */
async function getData({ locale, area }) {
  const [LANG, CONFIG, rest] = await Promise.all([
    getRemoteLanguage({ locale, nameSpace: LANG_NAMESPACE }),
    getRemoteConfig({ locale, nameSpace: CONFIG_NAMESPACE }),
    getConfigData({
      locale,
      configList: ["goodSort", "blog", "good", "product"],
      blogNameSpace: ["layout"],
      productNameSpace: ["layout", "sort"]
    })
  ]);

  const { BLOG, PRODUCT, GOODDISCOUNTFESTIVAL } = rest;

  const productList = [];

  PRODUCT.sort.forEach((item) => {
    return productList.push(...item.goodList);
  });

  PRODUCT.cart = productList.map((item) => ({
    key: item.key,
    name: item.name,
    sort_key: item.sort_key,
    image: item.image,
    comboList: item.comboList.map(
      ({ img_list, smart_img, description, ...combo }) => combo
    )
  }));

  return { LANG, CONFIG, BLOG, PRODUCT, GOODDISCOUNTFESTIVAL };
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
          <GoogleOneTap />
          <Layout
            locale={locale}
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
