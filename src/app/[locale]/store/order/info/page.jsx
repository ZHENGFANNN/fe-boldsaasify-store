import React from "react";

import getConfigDataV2 from "@/utils/getConfigDataV2";
import Main from "./component/Main";
import { cookies } from "next/headers";

export const runtime = "edge";

export async function generateMetadata({ params: { locale } }) {
  const { LANG, CONFIG } = await getConfigDataV2({
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
  const { LANG, CONFIG } = await getConfigDataV2({
    locale,
    configList: ["config", "language"],
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
