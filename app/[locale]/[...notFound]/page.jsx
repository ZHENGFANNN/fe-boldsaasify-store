/** @format */

import getRemoteLanguage from "@/config/Api/getRemoteLanguage";
import Main from "./Main";

async function NotFoundContent({ locale }) {
  const LANG = await getRemoteLanguage({
    locale,
    nameSpace: ["common.not_found"]
  });

  return <Main LANG={LANG} />;
}

export default async function NotFound({ params }) {
  const { locale } = await params;
  return <NotFoundContent locale={locale} />;
}
