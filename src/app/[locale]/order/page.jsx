import React from "react";
import { cookies } from "next/headers";
import Main from "./component/Main";
import getConfigData from "@/utils/getConfigData";

export const runtime = "edge";

export async function generateMetadata({ params: { locale } }) {
  const { LANG, CONFIG } = await getConfigData({
    locale,
    configList: ["config", "language"],
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

  if (result.GOODLIST) {
    result.GOODLIST = result.GOODLIST.map(
      ({
        associate_good_key,
        comboList,
        image_list,
        key,
        name,
        path,
        sort_key,
      }) => {
        return {
          associate_good_key,
          comboList,
          image: image_list[0].src,
          key,
          name,
          path,
          sort_key,
        };
      }
    );
  }

  return result;
}

export default async function Order({ params: { locale } }) {
  const area = cookies().get("area")?.value || "us";
  const token = cookies().get("token")?.value;

  const { CONFIG, LANG, GOODLIST, GOODDISCOUNTFESTIVAL } = await getData({
    locale,
    area,
    configList: ["config", "language", "good", "goodDiscountFestival"],
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
      GOODLIST={GOODLIST}
      token={token}
      area={area}
    />
  );
}
