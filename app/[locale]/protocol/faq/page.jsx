/** @format */

import styles from "./page.module.scss";

import getConfigData from "../../../utils/getConfigData";
import fillTemplate from "../../../utils/fillTemplate";
import FaqList from "./components/FaqList";
import StickyTitle from "./components/StickyTitle";
export const runtime = "edge";

async function getData({ locale }) {
  const result = await getConfigData({
    locale,
    configList: ["config", "language"],
    languageNameSpace: ["www.protocol_faq"],
    configNameSpace: [
      "company.basic.company_name",
      "company.basic.customer_service",
      "page.protocol.faq",
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
    title: `${CONFIG["company.basic.company_name"]} - ${LANG["www.protocol_faq.title"]}`,
    description: LANG["www.protocol_faq.description"],
    keywords: LANG["www.protocol_faq.keywords"],
  };
}

export default async function Faq({ params }) {
  const { locale } = await params;
  const { LANG, CONFIG } = await getData({
    locale,
  });
  const vars = {
    company_name: CONFIG["company.basic.company_name"],
    email: CONFIG["company.basic.customer_service"],
  };
  const faqList = Array.isArray(CONFIG["page.protocol.faq.content"])
    ? CONFIG["page.protocol.faq.content"].map((item) => ({
        ...item,
        question: fillTemplate(item.question, vars),
        answer: fillTemplate(item.answer, vars),
      }))
    : [];
  return (
    <div className={styles.container}>
      <StickyTitle LANG={LANG} />
      <div className={styles.content_container}>
        <div className={styles.content_title}>
          {LANG["www.protocol_faq.content_title"]}
        </div>
        <div className={styles.content_line}></div>
        <FaqList list={faqList} />
      </div>
    </div>
  );
}
