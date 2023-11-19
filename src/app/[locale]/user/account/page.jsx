import styles from "./page.module.scss";
import React from "react";

import getAllConfigData from "@/utils/getAllConfigData";
import Main from "./components/Main";

export const runtime = "edge";

export async function generateMetadata({ params: { locale } }) {
  const { LANG, CONFIG } = await getAllConfigData(locale);
  return {
    title: `${CONFIG["company.basic.company_name"]} - ${LANG["www.account.page_title"]}`,
    description: LANG["www.account.page_description"],
    keywords: LANG["www.account.page_keywords"],
  };
}

export default async function Account({ params: { locale } }) {
  const { LANG } = await getAllConfigData(locale);
  return <Main LANG={LANG} />;
}
