/** @format */

import styles from "./page.module.scss";
import getConfigData from "../../../utils/getConfigData";
import fillTemplate from "../../../utils/fillTemplate";
import StickyTitle from "./components/StickyTitle";

export const runtime = "edge";

async function getData({ locale }) {
  const result = await getConfigData({
    locale,
    configList: ["config", "language"],
    languageNameSpace: ["www.sales_policy"],
    configNameSpace: [
      "company.basic.company_name",
      "company.basic.customer_service",
      "page.protocol.sales",
    ],
  });
  return result;
}

export async function generateMetadata({ params }) {
  const { locale } = await params;
  const { LANG, CONFIG } = await getData({
    locale,
  });
  return {
    title: `${CONFIG["company.basic.company_name"]} - ${LANG["www.sales_policy.title"]}`,
    description: LANG["www.sales_policy.description"],
    keywords: LANG["www.sales_policy.keywords"],
  };
}

export default async function Faq({ params }) {
  const { locale } = await params;
  const { CONFIG, LANG } = await getData({
    locale,
  });
  const title = LANG["www.sales_policy.title"];
  const content = fillTemplate(CONFIG["page.protocol.sales.content"], {
    company_name: CONFIG["company.basic.company_name"],
    email: CONFIG["company.basic.customer_service"],
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
