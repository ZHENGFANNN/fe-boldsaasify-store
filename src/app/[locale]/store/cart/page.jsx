import React from "react";

import getAllConfigData from "@/utils/getAllConfigData";

import { cookies } from "next/headers";
import Main from "./components/Main";
export const runtime = "edge";

export async function generateMetadata({ params: { locale } }) {
  const { LANG, CONFIG } = await getAllConfigData(locale);
  return {
    title: `${LANG["store.cart.page_title"]} - ${CONFIG["company.basic.company_name"]}`,
    description: LANG["store.cart.page_description"],
    keywords: LANG["store.cart.page_keywords"],
  };
}

export default async function Cart({ params: { locale } }) {
  const { LANG, GOODLIST } = await getAllConfigData(locale);
  const area = cookies().get("area")?.value || "us";

  return <Main locale={locale} area={area} LANG={LANG} GOODLIST={GOODLIST} />;
}
