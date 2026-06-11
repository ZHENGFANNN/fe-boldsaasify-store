/** @format */

import { cookies } from "next/headers";
import Main from "./component/Main";
import getConfigData from "../../utils/getConfigData";

export async function generateMetadata({ params }) {
  const { locale } = await params;
  const { LANG, CONFIG } = await getConfigData({
    locale,
    configList: ["config", "language"],
    languageNameSpace: ["store.order"],
    configNameSpace: ["common.base"]
  });

  return {
    title: `${LANG["store.order.page_title"]} - ${CONFIG["common.base"]?.company_name}`,
    description: LANG["store.order.page_description"],
    keywords: LANG["store.order.page_keywords"]
  };
}

async function getData({
  locale,
  area,
  configList,
  languageNameSpace,
  configNameSpace
}) {
  return getConfigData({
    locale,
    area,
    configList,
    languageNameSpace,
    configNameSpace
  });
}

async function OrderContent({ locale }) {
  const cookieStore = await cookies();
  const area = cookieStore.get("area")?.value || "us";
  const token = cookieStore.get("token")?.value;

  const { CONFIG, LANG } = await getData({
    locale,
    area,
    configList: ["config", "language"],
    languageNameSpace: [
      "store.order",
      "common.pay",
      "user_account.shipping_address",
      "common.advantage"
    ],
    configNameSpace: ["common.base", "setting.pay"]
  });

  return <Main CONFIG={CONFIG} LANG={LANG} token={token} area={area} />;
}

export default async function Order({ params }) {
  const { locale } = await params;
  return <OrderContent locale={locale} />;
}
