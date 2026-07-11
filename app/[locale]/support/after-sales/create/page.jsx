/** @format */

import styles from "./page.module.scss";
import getRemoteLanguage from "@/config/Api/getRemoteLanguage";
import getRemoteConfig from "@/config/Api/getRemoteConfig";
import { buildAlternates } from "@/config/seo";
import CreateWizard from "./components/CreateWizard";

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
    title: `${company} - Submit an After-Sales Request`,
    description:
      "Start a return, refund, exchange or repair request. Pick your order or product, tell us what happened, and our team will follow up.",
    alternates: buildAlternates("/support/after-sales/create", locale),
  };
}

export default async function AfterSalesCreatePage({ params }) {
  const { locale } = await params;
  const { LANG } = await getData({ locale });
  return (
    <div className={styles.container}>
      <CreateWizard LANG={LANG} locale={locale} />
    </div>
  );
}
