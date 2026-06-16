/** @format */

import styles from "./page.module.scss";
import StickyTitle from "./components/StickyTitle";
import getRemoteLanguage from "@/config/Api/getRemoteLanguage";
import getRemoteConfig from "@/config/Api/getRemoteConfig";
import fillTemplate from "../../../utils/fillTemplate";
import { buildAlternates } from "@/config/seo";

async function getData({ locale }) {
  const [LANG, CONFIG] = await Promise.all([
    getRemoteLanguage({ locale, nameSpace: ["www.protocol_user"] }),
    getRemoteConfig({ locale, nameSpace: ["common.base", "protocol.user"] }),
  ]);
  return { LANG, CONFIG };
}

export async function generateMetadata({ params }) {
  const { locale } = await params;
  const { LANG, CONFIG } = await getData({
    locale,
  });
  return {
    title: `${CONFIG["common.base"]?.company_name} - ${LANG["www.protocol_user.title"]}`,
    description: LANG["www.protocol_user.description"],
    keywords: LANG["www.protocol_user.keywords"],
    alternates: buildAlternates("/protocol/user", locale),
  };
}

export default async function User({ params }) {
  const { locale } = await params;
  const { CONFIG, LANG } = await getData({
    locale,
  });
  const title = LANG["www.protocol_user.title"];
  const content = fillTemplate(CONFIG["protocol.user.article"], {
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
