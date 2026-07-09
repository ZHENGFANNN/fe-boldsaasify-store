import styles from "./page.module.scss";
import React from "react";

import getRemoteLanguage from "@/config/Api/getRemoteLanguage";
import getRemoteConfig from "@/config/Api/getRemoteConfig";
import ForgetForm from "./components/ForgetForm";
import BrandLogo from "@/components/BrandLogo";

async function getData({ locale }) {
  const [LANG, CONFIG] = await Promise.all([
    getRemoteLanguage({ locale, nameSpace: ["user_forget"] }),
    getRemoteConfig({ locale, nameSpace: ["common.base"] })
  ]);
  return { LANG, CONFIG };
}

export async function generateMetadata({ params }) {
  const { locale } = await params;
  const { LANG, CONFIG } = await getData({
    locale
  });
  return {
    title: `${CONFIG["common.base"]?.company_name} - ${LANG["user_forget.title"]}`,
    description: LANG["user_forget.description"],
    keywords: LANG["user_forget.keywords"]
  };
}

export default async function Forget({ params }) {
  const { locale } = await params;
  const { LANG, CONFIG } = await getData({
    locale
  });
  return (
    <div
      className={styles.container}
      style={{
        backgroundImage: `url(${process.env.NEXT_PUBLIC_FILE}/common/image/icon/bg.webp)`
      }}
    >
      <main className={styles.main}>
        <BrandLogo
          logo={CONFIG["common.base"]?.logo}
          companyName={CONFIG["common.base"]?.company_name}
        />
        <h1 className={styles.title}>
          {LANG["user_forget.retrieve_password"]}
        </h1>
        <ForgetForm LANG={LANG} />
      </main>
    </div>
  );
}
