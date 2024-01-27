import Link from "next/link";

import styles from "./page.module.scss";
import React from "react";

import getConfigDataV2 from "@/utils/getConfigDataV2";
// import IntroduceStaff from "./components/IntroduceStaff";
import CompanyHistory from "./components/CompanyHistory";
export const runtime = "edge";

export async function generateMetadata({ params: { locale } }) {
  const { LANG, CONFIG } = await getConfigDataV2({
    locale,
    configList: ["config", "language"],
  });
  return {
    title: `${CONFIG["company.basic.company_name"]} - ${LANG["www.company_introduce.title"]}`,
    description: LANG["www.company_introduce.description"],
    keywords: LANG["www.company_introduce.keywords"],
  };
}

export default async function Introduce({ params: { locale } }) {
  const { LANG, CONFIG } = await getConfigDataV2({
    locale,
    configList: ["config", "language"],
  });
  return (
    <div className={styles.container}>
      <div className={styles.video_container}>
        <video
          preload="true"
          loop
          height="100%"
          width="100%"
          playsInline
          autoPlay
          muted
          src={CONFIG["www.company.video_src"]}
          poster={CONFIG["www.company.video_poster"]}
        />
        <div className={styles.video_text_container}>
          <h1 className={styles.video_text_title}>
            {CONFIG["www.company.video_title"]}
          </h1>
          <p className={styles.video_text_description}>
            {CONFIG["www.company.video_description"]}
          </p>
        </div>
      </div>

      <section className={styles.company_introduce_container}>
        <h2 className={styles.company_introduce_title}>
          {LANG["www.company_introduce.company_profile"]}
        </h2>
        <div className={styles.company_introduce_description}>
          {CONFIG["company.basic.company_introduce"]}
        </div>
      </section>

      <section className={styles.content_container}>
        <div className={styles.content_container_inner}>
          <div className={styles.content_left}>
            <h3 className={styles.content_left_title}>
              {LANG["www.company_introduce.mission"]}
            </h3>
            <div className={styles.content_left_description}>
              {CONFIG["company.basic.company_mission"]}
            </div>
          </div>
          <div className={styles.content_right}>
            <div className={styles.content_right_top}>
              <h3 className={styles.content_right_title}>
                {LANG["www.company_introduce.vision"]}
              </h3>
              <p className={styles.content_right_description}>
                {CONFIG["company.basic.company_vision"]}
              </p>
            </div>
            <div className={styles.content_right_bottom}>
              <h3 className={styles.content_right_title}>
                {LANG["www.company_introduce.core_value"]}
              </h3>
              <p className={styles.content_right_description}>
                {CONFIG["company.basic.company_core"]}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.expand_sloga_container}>
        <div className={styles.expand_container_sloga__title}>
          {LANG["www.company_introduce.enterprise_history"]}
        </div>
        <div className={styles.expand_container_sloga__sub_title}>
          {LANG["www.company_introduce.ordinary_extraordinary"]}
        </div>
      </section>

      <CompanyHistory CONFIG={CONFIG} />
      {/* <IntroduceStaff LANG={LANG} CONFIG={CONFIG} /> */}

      <Link href="/company/contact">
        <section className={styles.footer_container}>
          <div className={styles.footer_content}>
            <h3 className={styles.footer_content_title}>
              {LANG["www.company_introduce.contact_us"]}
            </h3>
            <div className={styles.footer_content_description_container}>
              <div className={styles.footer_content_description}>
                {LANG["www.company_introduce.learn_more"]}
              </div>
              <div className={styles.arrow_icon}></div>
            </div>
          </div>
          <img
            alt={LANG["www.company_introduce.contact_us"]}
            // src={CONFIG["www.company.contact_img"]}
            src={`${process.env.NEXT_PUBLIC_IMAGE}/icon/bg.webp`}
          />
        </section>
      </Link>
    </div>
  );
}
