import React from "react";

import getConfigData from "@/utils/getConfigData";
import Main from "./component/Main";
import { cookies } from "next/headers";

export const runtime = "edge";

export async function generateMetadata({ params: { locale } }) {
  const { LANG, CONFIG } = await getConfigData({
    locale,
    configList: ["config", "language"],
  });
  return {
    title: `${LANG["store.order_info.order_info"]} - ${CONFIG["company.basic.company_name"]}`,
  };
}

export default async function Info({
  params: { locale },
  searchParams: { secret },
}) {
  const area = cookies().get("area")?.value || "us";
  const { LANG, CONFIG } = await getConfigData({
    locale,
    configList: ["config", "language"],
    languageNameSpace: ["store.order_info"],
    configNameSpace: [
      "company.basic.company_name",
      "company.basic.order_service",
      "pay.transfer.name",
      "pay.transfer.info",
      "pay.transfer.location",
      "pay.transfer.code",
    ],
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
