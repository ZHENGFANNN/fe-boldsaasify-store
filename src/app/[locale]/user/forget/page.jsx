import styles from "./page.module.scss";
import React from "react";

import getConfigDataV2 from "@/utils/getConfigDataV2";
import ForgetForm from "./components/ForgetForm";
export const runtime = "edge";

export async function generateMetadata({ params: { locale } }) {
  const { LANG, CONFIG } = await getConfigDataV2({
    locale,
    configList: ["config", "language"],
  });
  return {
    title: `${CONFIG["company.basic.company_name"]} - ${LANG["www.forget.title"]}`,
    description: LANG["www.forget.description"],
    keywords: LANG["www.forget.keywords"],
  };
}

export default async function Forget({ params: { locale } }) {
  const { LANG, CONFIG } = await getConfigDataV2({
    locale,
    configList: ["config", "language"],
  });
  return (
    <div
      className={styles.container}
      style={{
        backgroundImage: `url(${process.env.NEXT_PUBLIC_IMAGE}/icon/bg.webp)`,
      }}
    >
      <main className={styles.main}>
        <img
          alt={CONFIG["company.basic.company_name"]}
          src={CONFIG["company.basic.logo"]}
          width={40}
          height={40}
        />
        <h1 className={styles.title}>{LANG["www.forget.retrieve_password"]}</h1>
        <ForgetForm LANG={LANG} />
      </main>
    </div>
  );
}
