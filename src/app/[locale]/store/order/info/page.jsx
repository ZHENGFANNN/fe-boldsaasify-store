import React from "react";

import getAllConfigData from "@/utils/getAllConfigData";
import Main from "./component/Main";
import { cookies } from "next/headers";

export const runtime = "edge";

export async function generateMetadata({ params: { locale } }) {
  const { LANG, CONFIG } = await getAllConfigData(locale);
  return {
    title: `${LANG["store.order_info.order_info"]} - ${CONFIG["company.basic.company_name"]}`,
  };
}

export default async function Info({
  params: { locale },
  searchParams: { secret },
}) {
  const area = cookies().get("area")?.value || "us";
  const { CONFIG, LANG, GOODDISCOUNTFESTIVAL } = await getAllConfigData(locale);
  return (
    <Main
      LANG={LANG}
      CONFIG={CONFIG}
      secret={secret}
      area={area}
      locale={locale}
      goodDiscountFestival={GOODDISCOUNTFESTIVAL}
    />
  );
}
