/** @format */

import styles from "./page.module.scss";
import StickyTitle from "./components/StickyTitle";
import getConfigData from "@/utils/getConfigData";

export const runtime = "experimental-edge";

async function getData({ locale }) {
  const result = await getConfigData({
    locale,
    configList: ["config", "language"],
    languageNameSpace: ["www.protocol_policy"],
    configNameSpace: ["company.basic.company_name", "www.protocol.policy"],
  });
  return result;
}

export async function generateMetadata({ params: { locale } }) {
  const { LANG, CONFIG } = await getData({
    locale,
  });
  return {
    title: `${CONFIG["company.basic.company_name"]} - ${LANG["www.protocol_policy.title"]}`,
    description: LANG["www.protocol_policy.description"],
    keywords: LANG["www.protocol_policy.keywords"],
  };
}

export default async function Faq({ params: { locale } }) {
  const { CONFIG } = await getData({
    locale,
  });
  return (
    <div className={styles.container}>
      <StickyTitle CONFIG={CONFIG} />
      <div className={styles.content_container}>
        <div className={styles.content_title}>
          {CONFIG["www.protocol.policy.title"]}
        </div>
        <div className={styles.content_line}></div>
        <div className={styles.content}>
          <div
            dangerouslySetInnerHTML={{
              __html: CONFIG["www.protocol.policy.content"],
            }}
          />
        </div>
      </div>
    </div>
  );
}
