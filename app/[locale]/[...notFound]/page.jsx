/** @format */

import getConfigData from "../../utils/getConfigData";
import { cookies } from "next/headers";
import Main from "./Main";

async function NotFoundContent({ locale }) {
  const cookieStore = await cookies();
  const area = cookieStore.get("area")?.value || "us";
  const { LANG } = await getConfigData({
    locale,
    area,
    configList: ["language"],
    languageNameSpace: ["common.not_found"]
  });

  return <Main LANG={LANG} />;
}

export default async function NotFound({ params }) {
  const { locale } = await params;
  return <NotFoundContent locale={locale} />;
}
