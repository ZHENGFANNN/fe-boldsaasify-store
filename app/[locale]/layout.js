import "@/styles/globals.css";
import "@/styles/reset.css";

import Layout from "@/components/Layout";
import Navbar from "@/components/Layout/NavBar";
import Footer from "@/components/Layout/Footer";
import { GTMNoScript } from "@/components/Head/GTM";
import { AnalyticsNoScript } from "@/components/Head/Analytics";

import Head from "@/components/Head";
import GoogleAuthProvider from "@/components/GoogleAuth";
import GoogleOneTap from "@/components/GoogleAuth/GoogleOneTap";

import getRemoteLanguage from "@/config/Api/getRemoteLanguage";
import getRemoteConfig from "@/config/Api/getRemoteConfig";
import languageSettings from "@/config/languageSettings";

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
  "common.top_nav",
  "common.footer_nav"
];

/**
 * 获取布局数据。传统 ISR：不再用 'use cache'，
 * 缓存语义下沉到各 fetch 的 next:{tags,revalidate}。
 *
 * 导航全面配置化：导航栏读 CONFIG["common.top_nav"]、页脚读 CONFIG["common.footer_nav"]，
 * 不再依赖商品/博客分类聚合数据（旧 NAVFUNC + PRODUCT/BLOG layout 已下线）。
 * 购物车改 /api/cart 实时取价；博客 banner 由 blog 首页独立调用。
 *   - LANG / CONFIG：getRemoteLanguage / getRemoteConfig（按 nameSpace + locale）
 */
async function getData({ locale }) {
  const [LANG, CONFIG] = await Promise.all([
    getRemoteLanguage({ locale, nameSpace: LANG_NAMESPACE }),
    getRemoteConfig({ locale, nameSpace: CONFIG_NAMESPACE })
  ]);
  return { LANG, CONFIG };
}

export default async function RootLayout(props) {
  const { children, params } = props;
  const { locale } = await params;
  const { CONFIG, LANG } = await getData({ locale });

  return (
    <html lang={locale}>
      <Head logoLink={CONFIG["common.base"]?.logo} />
      <body>
        <GTMNoScript />
        <AnalyticsNoScript />
        <GoogleAuthProvider>
          <GoogleOneTap />
          <Layout locale={locale} LANG={LANG} CONFIG={CONFIG}>
            <Navbar />
            <div id="app-content">{children}</div>
            <Footer />
          </Layout>
        </GoogleAuthProvider>
      </body>
    </html>
  );
}
