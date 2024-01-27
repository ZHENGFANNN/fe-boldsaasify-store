import React from "react";
import getConfigDataV2 from "@/utils/getConfigDataV2";

import { cookies } from "next/headers";
import Main from "./components/Main";
export const runtime = "edge";

export async function generateMetadata({ params: { locale } }) {
  const { LANG, CONFIG } = await getConfigDataV2({
    locale,
    configList: ["config", "language"],
  });
  return {
    title: `${LANG["store.cart.page_title"]} - ${CONFIG["company.basic.company_name"]}`,
    description: LANG["store.cart.page_description"],
    keywords: LANG["store.cart.page_keywords"],
  };
}

export default async function Cart({ params: { locale } }) {
  const area = cookies().get("area")?.value || "us";
  const { LANG, GOODLIST, GOODDISCOUNTFESTIVAL } = await getConfigDataV2({
    locale,
    area,
    configList: ["language", "good", "goodDiscountFestival"],
  });
  return (
    <Main
      locale={locale}
      area={area}
      LANG={LANG}
      GOODLIST={GOODLIST}
      goodDiscountFestival={GOODDISCOUNTFESTIVAL}
    />
  );
}
