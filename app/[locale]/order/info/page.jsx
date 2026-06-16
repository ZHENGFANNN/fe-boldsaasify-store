import getRemoteLanguage from "@/config/Api/getRemoteLanguage";
import getRemoteConfig from "@/config/Api/getRemoteConfig";
import Main from "./component/Main";
import { cookies } from "next/headers";

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
    languageNameSpace: ["store.order_info.order_info"],
    configNameSpace: ["common.base"]
  });
  return {
    title: `${LANG["store.order_info.order_info"]} - ${CONFIG["common.base"]?.company_name}`
  };
}

async function OrderInfoContent({ locale, searchParams }) {
  const { secret } = await searchParams;
  const cookieStore = await cookies();
  const area = cookieStore.get("area")?.value || "us";
  const { LANG, CONFIG } = await getData({
    locale,
    languageNameSpace: ["store.order_info", "common.pay"],
    configNameSpace: ["common.base"]
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

export default async function Info({ params, searchParams }) {
  const { locale } = await params;
  return <OrderInfoContent locale={locale} searchParams={searchParams} />;
}
