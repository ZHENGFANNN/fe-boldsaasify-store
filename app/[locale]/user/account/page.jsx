/** @format */

import React from "react";

import getConfigData from "../../../utils/getConfigData";
import Main from "./components/Main";

export const runtime = "edge";

async function getData({ locale }) {
  const result = await getConfigData({
    locale,
    configList: ["config", "language"],
    languageNameSpace: ["user_account"],
    configNameSpace: ["company.basic.company_name"],
  });
  return result;
}

export async function generateMetadata({ params }) {
  const { locale } = await params;
  const { LANG, CONFIG } = await getData({
    locale,
  });
  return {
    title: `${CONFIG["company.basic.company_name"]} - ${LANG["user_account.page_title"]}`,
    description: LANG["user_account.page_description"],
    keywords: LANG["user_account.page_keywords"],
  };
}

export default async function Account({ params }) {
  const { locale } = await params;
  const { LANG } = await getData({
    locale,
  });
  return <Main LANG={LANG} />;
}
