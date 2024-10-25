/** @format */

import Link from "next/link";
import styles from "./page.module.scss";
import getConfigData from "../../../utils/getConfigData";

export const runtime = "experimental-edge";

async function getData({ locale }) {
  const result = await getConfigData({
    locale,
    configList: ["config", "language"],
    languageNameSpace: ["www.company_technology"],
    configNameSpace: ["company.basic", "www.cooperate"],
  });
  return result;
}

export async function generateMetadata({ params }) {
  const { locale } = await params;
  const { LANG, CONFIG } = await getData({
    locale,
  });
  return {
    title: `${CONFIG["company.basic.company_name"]} - ${LANG["www.company_technology.title"]}`,
    description: LANG["www.company_technology.description"],
    keywords: LANG["www.company_technology.keywords"],
  };
}
export default async function Technology({ params }) {
  const { locale } = await params;
  const { LANG, CONFIG } = await getData({
    locale,
  });
  return (
    <div className={styles.container}>
      <section className={styles.top_container}>
        <div className={styles.top_content}>
          <h1 className={styles.top_content_title}>
            {LANG["www.company_technology.technical_cooperation"]}
          </h1>
          <div className={styles.top_content_description_container}>
            <div className={styles.top_content_description}>
              {LANG["www.company_technology.welcome"]}
            </div>
          </div>
        </div>
        <img
          alt={LANG["www.company_technology.contact"]}
          src={`${process.env.NEXT_PUBLIC_FILE}/image/icon/bg.webp`}
          // src={CONFIG["www.cooperate.technology_img"]}
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
        <Link
          scroll={true}
          href="/company/introduce"
          className={styles.content_about_us}
        >
          <span> {LANG["www.company_technology.see_more"]}</span>
          <span className={styles.arrow_icon}></span>
        </Link>
      </section>

      <section className={styles.content_container}>
        <h2 className={styles.content_title}>
          {LANG["www.company_technology.cooperative_content"]}
        </h2>
        <p className={styles.content_description}>
          {CONFIG["www.cooperate.technology_content_description"]}
        </p>
      </section>

      <section className={styles.content_container}>
        <h2 className={styles.content_title}>
          {LANG["www.company_technology.cooperation_requirements"]}
        </h2>
        <p className={styles.content_description}>
          {CONFIG["www.cooperate.technology_require_description"]}
        </p>
      </section>

      <section className={styles.contact_email_container}>
        <div className={styles.contact_email}>
          <h3>{LANG["www.company_technology.contact"]}</h3>
          <p>{CONFIG["www.cooperate.technology_connect"]}</p>
        </div>
      </section>
    </div>
  );
}
