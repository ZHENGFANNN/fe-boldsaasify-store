import React from "react";

import getRemoteLanguage from "@/config/Api/getRemoteLanguage";
import SideNav from "./components/SideNav";
import styles from "./page.module.scss";

async function getData({ locale }) {
  const LANG = await getRemoteLanguage({
    locale,
    nameSpace: ["user_account"],
  });
  return { LANG };
}

export default async function AccountLayout({ children, params }) {
  const { locale } = await params;
  const { LANG } = await getData({ locale });
  return (
    <div className={styles.container}>
      <SideNav LANG={LANG} locale={locale} />
      <div className={styles.content}>{children}</div>
    </div>
  );
}
