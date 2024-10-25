/** @format */

import styles from "./page.module.scss";
import StickyTitle from "./components/StickyTitle";
import getConfigData from "../../../utils/getConfigData";

export const runtime = "experimental-edge";

async function getData({ locale }) {
  const result = await getConfigData({
    locale,
    configList: ["config", "language"],
    languageNameSpace: ["www.protocol_user"],
    configNameSpace: ["company.basic.company_name", "www.protocol.service"],
  });
  return result;
}

export async function generateMetadata({ params }) {
  const { locale } = await params;
  const { LANG, CONFIG } = await getData({
    locale,
  });
  return {
    title: `${CONFIG["company.basic.company_name"]} - ${LANG["www.protocol_user.title"]}`,
    description: LANG["www.protocol_user.description"],
    keywords: LANG["www.protocol_user.keywords"],
  };
}

export default async function User({ params }) {
  const { locale } = await params;
  const { CONFIG } = await getData({
    locale,
  });
  return (
    <div className={styles.container}>
      <StickyTitle CONFIG={CONFIG} />
      <div className={styles.content_container}>
        <div className={styles.content_title}>
          {CONFIG["www.protocol.service.title"]}
        </div>
        <div className={styles.content_line}></div>
        <div className={styles.content}>
          <div
            dangerouslySetInnerHTML={{
              __html: CONFIG["www.protocol.service.content"],
            }}
          />
        </div>
      </div>
    </div>
  );
}
