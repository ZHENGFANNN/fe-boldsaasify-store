/** @format */

import styles from "./page.module.scss";

import getConfigData from "@/utils/getConfigData";
import FaqList from "./components/FaqList";
import StickyTitle from "./components/StickyTitle";
export const runtime = "edge";

async function getData({ locale }) {
  const result = await getConfigData({
    locale,
    configList: ["config", "language"],
    languageNameSpace: ["www.protocol_faq"],
    configNameSpace: ["company.basic.company_name", "www.protocol.faq"],
  });
  return result;
}

export async function generateMetadata({ params: { locale } }) {
  const { LANG, CONFIG } = await getData({
    locale,
  });
  return {
    title: `${CONFIG["company.basic.company_name"]} - ${LANG["www.protocol_faq.title"]}`,
    description: LANG["www.protocol_faq.description"],
    keywords: LANG["www.protocol.faq"],
  };
}

export default async function Faq({ params: { locale } }) {
  const { LANG, CONFIG } = await getData({
    locale,
  });
  return (
    <div className={styles.container}>
      <StickyTitle LANG={LANG} />
      <div className={styles.content_container}>
        <div className={styles.content_title}>
          {LANG["www.protocol_faq.content_title"]}
        </div>
        <div className={styles.content_line}></div>
        <FaqList CONFIG={CONFIG} />
      </div>
    </div>
  );
}
