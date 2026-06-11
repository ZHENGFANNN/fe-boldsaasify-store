import getConfigData from "../../../utils/getConfigData";
import Main from "./component/Main";
import { cookies } from "next/headers";

export async function generateMetadata({ params }) {
  const { locale } = await params;
  const { LANG, CONFIG } = await getConfigData({
    locale,
    configList: ["config", "language"],
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
  const { LANG, CONFIG } = await getConfigData({
    locale,
    configList: ["config", "language"],
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
