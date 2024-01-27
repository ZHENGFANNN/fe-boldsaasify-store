import styles from "./page.module.scss";
import getConfigDataV2 from "@/utils/getConfigDataV2";
import StickyTitle from "./components/StickyTitle";

export const runtime = "edge";

export async function generateMetadata({ params: { locale } }) {
  const { LANG, CONFIG } = await getConfigDataV2({
    locale,
    configList: ["config", "language"],
  });
  return {
    title: `${CONFIG["company.basic.company_name"]} - ${LANG["www.sales_policy.title"]}`,
    description: LANG["www.sales_policy.description"],
    keywords: LANG["www.sales_policy.keywords"],
  };
}

export default async function Faq({ params: { locale } }) {
  const { CONFIG } = await getConfigDataV2({
    locale,
    configList: ["config"],
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
