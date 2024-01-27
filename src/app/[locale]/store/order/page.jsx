import React from "react";
import { cookies } from "next/headers";
import Main from "./component/Main";
import getConfigDataV2 from "@/utils/getConfigDataV2";

export const runtime = "edge";

export async function generateMetadata({ params: { locale } }) {
  const { LANG, CONFIG } = await getConfigDataV2({
    locale,
    configList: ["config", "language"],
  });

  return {
    title: `${LANG["store.order.page_title"]} - ${CONFIG["company.basic.company_name"]}`,
    description: LANG["store.order.page_description"],
    keywords: LANG["store.order.page_keywords"],
  };
}

export default async function Order({ params: { locale } }) {
  const area = cookies().get("area")?.value || "us";
  const token = cookies().get("token")?.value;

  const { CONFIG, LANG, GOODLIST, GOODDISCOUNTFESTIVAL } =
    await getConfigDataV2({
      locale,
      area,
      configList: ["config", "language", "good", "goodDiscountFestival"],
    });

  return (
    <Main
      GOODDISCOUNTFESTIVAL={GOODDISCOUNTFESTIVAL}
      CONFIG={CONFIG}
      LANG={LANG}
      GOODLIST={GOODLIST}
      token={token}
      area={area}
    />
  );
}
