import Link from "next/link";
import getConfigDataV2 from "@/utils/getConfigDataV2";
import styles from "./page.module.scss";

export const runtime = "edge";

export async function generateMetadata({ params: { locale } }) {
  const { LANG, CONFIG } = await getConfigDataV2({
    locale,
    configList: ["config", "language"],
  });
  return {
    title: `${CONFIG["company.basic.company_name"]} - ${LANG["www.company_market.title"]}`,
    description: LANG["www.company_market.description"],
    keywords: LANG["www.company_market.keywords"],
  };
}

export default async function Market({ params: { locale } }) {
  const { LANG, CONFIG } = await getConfigDataV2({
    locale,
    configList: ["config", "language"],
  });
  return (
    <div className={styles.container}>
      <section className={styles.top_container}>
        <div className={styles.top_content}>
          <h1 className={styles.top_content_title}>
            {LANG["www.company_market.market_collaboration"]}
          </h1>
          <div className={styles.top_content_description_container}>
            <div className={styles.top_content_description}>
              {LANG["www.company_market.welcome"]}
            </div>
          </div>
        </div>
        <img
          alt={LANG["www.company_market.contact"]}
          src={`${process.env.NEXT_PUBLIC_IMAGE}/icon/bg.webp`}
          // CONFIG["www.cooperate.market_img"]
        />
      </section>

      <section className={styles.content_container}>
        <h2 className={styles.content_title}>
          {CONFIG["www.cooperate.common_title"]}
        </h2>
        <h3 className={styles.content_sub_title}>
          {CONFIG["www.cooperate.common_sub_title"]}
        </h3>
        <p className={styles.content_description}>
          {CONFIG["www.cooperate.common_description"]}
        </p>
        <Link href="/company/introduce" className={styles.content_about_us}>
          <span>{LANG["www.company_market.see_more"]}</span>
          <span className={styles.arrow_icon}></span>
        </Link>
      </section>

      <section className={styles.content_container}>
        <h2 className={styles.content_title}>
          {LANG["www.company_market.cooperation_content"]}
        </h2>
        <p className={styles.content_description}>
          {CONFIG["www.cooperate.market_content_description"]}
        </p>
      </section>

      <section className={styles.content_container}>
        <h2 className={styles.content_title}>
          {LANG["www.company_market.cooperation_require"]}
        </h2>
        <p className={styles.content_description}>
          {CONFIG["www.cooperate.market_require_description"]}
        </p>
      </section>

      <section className={styles.contact_email_container}>
        <div className={styles.contact_email}>
          <h3>{LANG["www.company_market.contact"]}</h3>
          <p>{CONFIG["www.cooperate.market_connect"]}</p>
        </div>
      </section>
    </div>
  );
}
