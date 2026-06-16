/** @format */

import { cookies } from "next/headers";
import Main from "./component/Main";
import getRemoteLanguage from "@/config/Api/getRemoteLanguage";
import getRemoteConfig from "@/config/Api/getRemoteConfig";

async function getData({ locale, languageNameSpace, configNameSpace }) {
  const [LANG, CONFIG] = await Promise.all([
    getRemoteLanguage({ locale, nameSpace: languageNameSpace }),
    getRemoteConfig({ locale, nameSpace: configNameSpace })
  ]);
  return { LANG, CONFIG };
}

export async function generateMetadata({ params }) {
  const { locale } = await params;
  const { LANG, CONFIG } = await getData({
    locale,
    languageNameSpace: ["store.order"],
    configNameSpace: ["common.base"]
  });

  return {
    title: `${LANG["store.order.page_title"]} - ${CONFIG["common.base"]?.company_name}`,
    description: LANG["store.order.page_description"],
    keywords: LANG["store.order.page_keywords"]
  };
}

async function OrderContent({ locale }) {
  const cookieStore = await cookies();
  const area = cookieStore.get("area")?.value || "us";
  const token = cookieStore.get("token")?.value;

  const { CONFIG, LANG } = await getData({
    locale,
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
