import React from "react";

import getConfigDataV2 from "@/utils/getConfigDataV2";
import Main from "./components/Main";

export const runtime = "edge";

export async function generateMetadata({ params: { locale } }) {
  const { LANG, CONFIG } = await getConfigDataV2({
    locale,
    configList: ["config", "language"],
  });
  return {
    title: `${CONFIG["company.basic.company_name"]} - ${LANG["www.account.page_title"]}`,
    description: LANG["www.account.page_description"],
    keywords: LANG["www.account.page_keywords"],
  };
}

export default async function Account({ params: { locale } }) {
  const { LANG } = await getConfigDataV2({
    locale,
    configList: ["language"],
  });
  return <Main LANG={LANG} />;
}
