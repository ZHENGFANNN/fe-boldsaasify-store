/** @format */

import getRemoteLanguage from "@/config/Api/getRemoteLanguage";
import getRemoteConfig from "@/config/Api/getRemoteConfig";
import { buildAlternates } from "@/config/seo";
import ProgressClient from "./components/ProgressClient";

async function getData({ locale }) {
  const [LANG, CONFIG] = await Promise.all([
    getRemoteLanguage({ locale, nameSpace: ["user_account"] }),
    getRemoteConfig({ locale, nameSpace: ["common.base"] }),
  ]);
  return { LANG, CONFIG };
}

export async function generateMetadata({ params }) {
  const { locale } = await params;
  const { CONFIG } = await getData({ locale });
  const company = CONFIG["common.base"]?.company_name || "";
  return {
    title: `${company} - Track After-Sales Service`,
    description:
      "Track the status and history of all your after-sales requests in one place.",
    alternates: buildAlternates("/support/after-sales/progress", locale),
    robots: { index: false, follow: false },
  };
}

export default async function AfterSalesProgressPage({ params }) {
  const { locale } = await params;
  const { LANG } = await getData({ locale });
  // 外层 .container 由 ProgressClient 在登录检查后自行渲染，未登录时 AuthRedirectGuard 直接返回不套壳
  return <ProgressClient LANG={LANG} locale={locale} />;
}
