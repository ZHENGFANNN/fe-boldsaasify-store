/** @format */

import styles from "./page.module.scss";
import React from "react";

import getConfigData from "../../../utils/getConfigData";
import ForgetForm from "./components/ForgetForm";
export const runtime = "edge";

async function getData({ locale }) {
  const result = await getConfigData({
    locale,
    configList: ["config", "language"],
    languageNameSpace: ["user_forget"],
    configNameSpace: ["company.basic.company_name", "company.basic.logo"],
  });
  return result;
}

export async function generateMetadata({ params }) {
  const { locale } = await params;
  const { LANG, CONFIG } = await getData({
    locale,
  });
  return {
    title: `${CONFIG["company.basic.company_name"]} - ${LANG["user_forget.title"]}`,
    description: LANG["user_forget.description"],
    keywords: LANG["user_forget.keywords"],
  };
}

export default async function Forget({ params }) {
  const { locale } = await params;
  const { LANG, CONFIG } = await getData({
    locale,
    configList: ["config", "language"],
  });
  return (
    <div
      className={styles.container}
      style={{
        backgroundImage: `url(${process.env.NEXT_PUBLIC_FILE}/common/image/icon/bg.webp)`,
      }}
    >
      <main className={styles.main}>
        <img
          alt={CONFIG["company.basic.company_name"]}
          src={CONFIG["company.basic.logo"]}
          width={40}
          height={40}
        />
        <h1 className={styles.title}>{LANG["user_forget.retrieve_password"]}</h1>
        <ForgetForm LANG={LANG} />
      </main>
    </div>
  );
}
