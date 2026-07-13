/** @format */

import Link from "next/link";
import styles from "./page.module.scss";
import React from "react";
import getRemoteLanguage from "@/config/Api/getRemoteLanguage";
import getRemoteConfig from "@/config/Api/getRemoteConfig";
import RegisterForm from "./components/RegisterForm";
import GoogleLoginPanel from "@/components/GoogleAuth/GoogleLoginPanel";

async function getData({ locale }) {
  const [LANG, CONFIG] = await Promise.all([
    getRemoteLanguage({ locale, nameSpace: ["user_register"] }),
    getRemoteConfig({ locale, nameSpace: ["common.base"] }),
  ]);
  return { LANG, CONFIG };
}

export async function generateMetadata({ params }) {
  const { locale } = await params;
  const { LANG, CONFIG } = await getData({
    locale,
  });
  return {
    title: `${CONFIG["common.base"]?.company_name} - ${LANG["user_register.title"]}`,
    description: LANG["user_register.description"],
    keywords: LANG["user_register.keywords"],
  };
}

export default async function Register({ params }) {
  const { locale } = await params;
  const { LANG } = await getData({
    locale,
  });
  return (
    <div className={styles.container}>
      <main className={styles.main}>
        <h1 className={styles.title}>
          {LANG["user_register.regsiter_title"]}
        </h1>
        <GoogleLoginPanel
          className={styles.google_top}
          label="OR"
          dividerPosition="bottom"
          buttonLabel={LANG["user_register.google_continue"] || "Continue with Google"}
          successText={LANG["user_register.register_success"]}
          errorText={LANG["user_register.tip_service_exception"]}
        />
        <RegisterForm LANG={LANG} />
        <p className={styles.register}>
          <span>{LANG["user_register.already_account"]}</span>
          <Link scroll={true} href="/user/login">
            {LANG["user_register.login_now"]}
          </Link>
        </p>
        <div className={styles.agreen}>
          <span>{LANG["user_register.contiuning_agree"]}</span>
          <Link scroll={true} href="/article/legal/privacy-policy">
            {LANG["user_register.privacy_policy"]}
          </Link>
          <span>{LANG["user_register.and"]}</span>
          <Link scroll={true} href="/article/legal/user-agreement">
            {LANG["user_register.user_service"]}
          </Link>
        </div>
      </main>
    </div>
  );
}
