/** @format */

import React from "react";
import { cookies } from "next/headers";
import Main from "./component/Main";
import getConfigData from "../../utils/getConfigData";

export const runtime = "edge";

export async function generateMetadata({ params }) {
  const { locale } = await params;
  const { LANG, CONFIG } = await getConfigData({
    locale,
    configList: ["config", "language"],
    languageNameSpace: ["store.order"],
    configNameSpace: ["company.basic.company_name"],
  });

  return {
    title: `${LANG["store.order.page_title"]} - ${CONFIG["company.basic.company_name"]}`,
    description: LANG["store.order.page_description"],
    keywords: LANG["store.order.page_keywords"],
  };
}

async function getData({
  locale,
  area,
  configList,
  languageNameSpace,
  configNameSpace,
}) {
  const result = await getConfigData({
    locale,
    area,
    configList,
    languageNameSpace,
    configNameSpace,
  });

  return result;
}

export default async function Order({ params }) {
  const { locale } = await params;
  const cookieStore = await cookies();
  const area = cookieStore.get("area")?.value || "us";
  const token = cookieStore.get("token")?.value;

  const { CONFIG, LANG, GOODDISCOUNTFESTIVAL } = await getData({
    locale,
    area,
    configList: ["config", "language", "goodDiscountFestival"],
    languageNameSpace: [
      "store.order",
      "store.product.pay_fail",
      "common.advantage",
    ],
    configNameSpace: [
      "company.basic.company_name",
      "company.basic.customer_service",
    ],
  });

  return (
    <Main
      GOODDISCOUNTFESTIVAL={GOODDISCOUNTFESTIVAL}
      CONFIG={CONFIG}
      LANG={LANG}
      token={token}
      area={area}
    />
  );
}
