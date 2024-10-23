/** @format */

import styles from "./page.module.scss";
import getConfigData from "@/utils/getConfigData";
import StickyTitle from "./components/StickyTitle";

export const runtime = "edge";

async function getData({ locale }) {
  const result = await getConfigData({
    locale,
    configList: ["config", "language"],
    languageNameSpace: ["www.sales_policy"],
    configNameSpace: ["company.basic.company_name", "www.protocol.sales"],
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
  const { CONFIG } = await getData({
    locale,
  });
  return (
    <div className={styles.container}>
      <StickyTitle CONFIG={CONFIG} />
      <div className={styles.content_container}>
        <div className={styles.content_title}>
          {CONFIG["www.protocol.sales.title"]}
        </div>
        <div className={styles.content_line}></div>
        <div className={styles.content}>
          <div
            dangerouslySetInnerHTML={{
              __html: CONFIG["www.protocol.sales.content"],
            }}
          />
        </div>
      </div>
    </div>
  );
}
