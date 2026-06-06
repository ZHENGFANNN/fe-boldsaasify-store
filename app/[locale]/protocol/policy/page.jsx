/** @format */

import styles from "./page.module.scss";
import StickyTitle from "./components/StickyTitle";
import getConfigData from "../../../utils/getConfigData";
import fillTemplate from "../../../utils/fillTemplate";

async function getData({ locale }) {
  const result = await getConfigData({
    locale,
    configList: ["config", "language"],
    languageNameSpace: ["www.protocol_policy"],
    configNameSpace: [
      "company.basic.company_name",
      "company.basic.customer_service",
      "page.protocol.policy",
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
    title: `${CONFIG["company.basic.company_name"]} - ${LANG["www.protocol_policy.title"]}`,
    description: LANG["www.protocol_policy.description"],
    keywords: LANG["www.protocol_policy.keywords"],
  };
}

export default async function Faq({ params }) {
  const { locale } = await params;
  const { CONFIG, LANG } = await getData({
    locale,
  });
  const title = LANG["www.protocol_policy.title"];
  const content = fillTemplate(CONFIG["page.protocol.policy.content"], {
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
