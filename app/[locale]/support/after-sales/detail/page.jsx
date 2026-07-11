/** @format */

import styles from "./page.module.scss";
import getRemoteLanguage from "@/config/Api/getRemoteLanguage";
import getRemoteConfig from "@/config/Api/getRemoteConfig";
import { buildAlternates } from "@/config/seo";
import DetailClient from "./components/DetailClient";

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
    title: `${company} - After-Sales Request Status`,
    description:
      "Track the status of your after-sales request and view the details you submitted.",
    alternates: buildAlternates("/support/after-sales/detail", locale),
    robots: { index: false, follow: false },
  };
}

export default async function AfterSalesDetailPage({ params }) {
  const { locale } = await params;
  const { LANG } = await getData({ locale });
  return (
    <div className={styles.container}>
      <DetailClient LANG={LANG} locale={locale} />
    </div>
  );
}
