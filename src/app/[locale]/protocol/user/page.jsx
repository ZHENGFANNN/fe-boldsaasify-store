import styles from "./page.module.scss";
import StickyTitle from "./components/StickyTitle";
import getConfigDataV2 from "@/utils/getConfigDataV2";

export const runtime = "experimental-edge";

export async function generateMetadata({ params: { locale } }) {
  const { LANG, CONFIG } = await getConfigDataV2({
    locale,
    configList: ["config", "language"],
  });
  return {
    title: `${CONFIG["company.basic.company_name"]} - ${LANG["www.protocol_user.title"]}`,
    description: LANG["www.protocol_user.description"],
    keywords: LANG["www.protocol_user.keywords"],
  };
}

export default async function User({ params: { locale } }) {
  const { CONFIG } = await getConfigDataV2({
    locale,
    configList: ["config"],
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
