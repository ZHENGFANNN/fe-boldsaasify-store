import React from "react";

import getRemoteLanguage from "@/config/Api/getRemoteLanguage";
import getRemoteConfig from "@/config/Api/getRemoteConfig";
import AddressPageClient from "./AddressPageClient";

async function getData({ locale }) {
  const [LANG, CONFIG] = await Promise.all([
    getRemoteLanguage({ locale, nameSpace: ["user_account"] }),
    getRemoteConfig({ locale, nameSpace: ["common.base"] }),
  ]);
  return { LANG, CONFIG };
}

export async function generateMetadata({ params }) {
  const { locale } = await params;
  const { LANG, CONFIG } = await getData({ locale });
  return {
    title: `${CONFIG["common.base"]?.company_name} - ${LANG["user_account.shipping_address"]}`,
    description: LANG["user_account.page_description"],
    keywords: LANG["user_account.page_keywords"],
  };
}

export default async function AccountAddressPage({ params }) {
  const { locale } = await params;
  const { LANG } = await getData({ locale });
  return <AddressPageClient LANG={LANG} locale={locale} />;
}
