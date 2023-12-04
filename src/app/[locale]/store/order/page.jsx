import React from "react";
import { cookies } from "next/headers";
import Main from "./component/Main";
import getAllConfigData from "@/utils/getAllConfigData";

export const runtime = "edge";

export async function generateMetadata({ params: { locale } }) {
  const { LANG, CONFIG } = await getAllConfigData(locale);
  return {
    title: `${CONFIG["company.basic.company_name"]} - ${LANG["store.order.page_title"]}`,
    description: LANG["store.order.page_description"],
    keywords: LANG["store.order.page_keywords"],
  };
}

export default async function Order({ params: { locale } }) {
  const { CONFIG, LANG, GOODLIST } = await getAllConfigData(locale);
  const area = cookies().get("area")?.value || "us";
  const token = cookies().get("token")?.value;
  return (
    <Main
      CONFIG={CONFIG}
      LANG={LANG}
      GOODLIST={GOODLIST}
      token={token}
      area={area}
    />
  );
}
