/** @format */

import Link from "next/link";
import React from "react";
import styles from "./page.module.scss";
import getRemoteLanguage from "@/config/Api/getRemoteLanguage";
import getRemoteConfig from "@/config/Api/getRemoteConfig";
import LoginForm from "./components/LoginForm";
import GoogleLoginPanel from "@/components/GoogleAuth/GoogleLoginPanel";
import BrandLogo from "@/components/BrandLogo";

async function getData({ locale }) {
  const [LANG, CONFIG] = await Promise.all([
    getRemoteLanguage({ locale, nameSpace: ["user_login"] }),
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
    title: `${CONFIG["common.base"]?.company_name} - ${LANG["user_login.title"]}`,
    description: LANG["user_login.description"],
    keywords: LANG["user_login.keywords"],
  };
}

export default async function Login({ params }) {
  const { locale } = await params;
  const { LANG, CONFIG } = await getData({
    locale,
  });
  return (
    <div
      className={styles.container}
      style={{
        backgroundImage: `url(${process.env.NEXT_PUBLIC_FILE}/common/image/icon/bg.webp)`,
      }}
    >
      <main className={styles.main}>
        <BrandLogo
          logo={CONFIG["common.base"]?.logo}
          companyName={CONFIG["common.base"]?.company_name}
        />
        <h1 className={styles.title}>{LANG["user_login.login_title"]}</h1>
        <LoginForm LANG={LANG} CONFIG={CONFIG} />

        {/* 第三方登录：Google */}
        <GoogleLoginPanel
          label={LANG["user_login.other_login"]}
          successText={LANG["user_login.login_success"]}
          errorText={LANG["user_login.server_error"]}
        />
        <div className={styles.agreen}>
          <span>{LANG["user_login.countinue_agree"]}</span>
          <Link scroll={true} href="/article/legal/privacy-policy">
            {LANG["user_login.privacy_policy"]}
          </Link>
          <span>{LANG["user_login.and"]}</span>
          <Link scroll={true} href="/article/legal/user-agreement">
            {LANG["user_login.user_service"]}
          </Link>
        </div>
        <div className={styles.help}>
          <span>{LANG["user_login.login_help"]}</span>
          <Link scroll={true} href="/support/contact">
            {LANG["user_login.contact_us"]}
          </Link>
        </div>
      </main>
    </div>
  );
}
