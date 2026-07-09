/** @format */

import React from "react";

import getRemoteLanguage from "@/config/Api/getRemoteLanguage";
import getRemoteConfig from "@/config/Api/getRemoteConfig";
import Main from "./components/Main";

async function getData({ locale }) {
  const [LANG, CONFIG] = await Promise.all([
    getRemoteLanguage({ locale, nameSpace: ["user_account"] }),
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
    title: `${CONFIG["common.base"]?.company_name} - ${LANG["user_account.page_title"]}`,
    description: LANG["user_account.page_description"],
    keywords: LANG["user_account.page_keywords"]
  };
}

export default async function Account({ params }) {
  const { locale } = await params;
  const { LANG } = await getData({ locale });
  return <Main LANG={LANG} locale={locale} />;
}
