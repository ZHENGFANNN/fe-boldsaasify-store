/** @format */

import styles from "./page.module.scss";
import getRemoteLanguage from "@/config/Api/getRemoteLanguage";
import getRemoteConfig from "@/config/Api/getRemoteConfig";
import fillTemplate from "../../../utils/fillTemplate";
import { buildAlternates } from "@/config/seo";
import StickyTitle from "./components/StickyTitle";

async function getData({ locale }) {
  const [LANG, CONFIG] = await Promise.all([
    getRemoteLanguage({ locale, nameSpace: ["www.sales_policy"] }),
    getRemoteConfig({ locale, nameSpace: ["common.base", "protocol.sales"] }),
  ]);
  return { LANG, CONFIG };
}

export async function generateMetadata({ params }) {
  const { locale } = await params;
  const { LANG, CONFIG } = await getData({
    locale,
  });
  return {
    title: `${CONFIG["common.base"]?.company_name} - ${LANG["www.sales_policy.title"]}`,
    description: LANG["www.sales_policy.description"],
    keywords: LANG["www.sales_policy.keywords"],
    alternates: buildAlternates("/protocol/sales", locale),
  };
}

export default async function Faq({ params }) {
  const { locale } = await params;
  const { CONFIG, LANG } = await getData({
    locale,
  });
  const title = LANG["www.sales_policy.title"];
  const content = fillTemplate(CONFIG["protocol.sales.article"], {
    company_name: CONFIG["common.base"]?.company_name,
    email: CONFIG["common.base"]?.customer_service,
  });
  return (
    <div className={styles.container}>
      <StickyTitle title={title} />
      <div className={styles.content_container}>
        <div className={styles.content_title}>{title}</div>
        <div className={styles.content_line}></div>
        <div className={styles.content}>
          <div dangerouslySetInnerHTML={{ __html: content }} />
        </div>
      </div>
    </div>
  );
}
