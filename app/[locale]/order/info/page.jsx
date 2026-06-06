/** @format */

import React from "react";

import getConfigData from "../../../utils/getConfigData";
import Main from "./component/Main";
import { cookies } from "next/headers";

export async function generateMetadata({ params }) {
  const { locale } = await params;
  const { LANG, CONFIG } = await getConfigData({
    locale,
    configList: ["config", "language"],
    languageNameSpace: ["store.order_info.order_info"],
    configNameSpace: ["company.basic.company_name"],
  });
  return {
    title: `${LANG["store.order_info.order_info"]} - ${CONFIG["company.basic.company_name"]}`,
  };
}

export default async function Info({ params, searchParams }) {
  const { locale } = await params;
  const { secret } = await searchParams;
  const cookieStore = await cookies();
  const area = cookieStore.get("area")?.value || "us";
  const { LANG, CONFIG } = await getConfigData({
    locale,
    configList: ["config", "language"],
    languageNameSpace: ["store.order_info", "common.pay"],
    configNameSpace: ["company.basic.company_name"],
  });
  return (
    <Main
      LANG={LANG}
      CONFIG={CONFIG}
      secret={secret}
      area={area}
      locale={locale}
    />
  );
}
