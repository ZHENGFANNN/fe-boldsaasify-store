/** @format */

import Link from "next/link";
import React from "react";
import styles from "./page.module.scss";
import getConfigData from "../../../utils/getConfigData";
import LoginForm from "./components/LoginForm";
import GoogleLoginPanel from "@/components/GoogleAuth/GoogleLoginPanel";

async function getData({ locale }) {
  const result = await getConfigData({
    locale,
    configList: ["config", "language"],
    languageNameSpace: ["user_login"],
    configNameSpace: ["common.base"],
  });
  return result;
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
        <img
          alt={CONFIG["common.base"]?.company_name}
          src={CONFIG["common.base"]?.logo}
          width={40}
          height={40}
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
          <Link scroll={true} href="/protocol/policy">
            {LANG["user_login.privacy_policy"]}
          </Link>
          <span>{LANG["user_login.and"]}</span>
          <Link scroll={true} href="/protocol/user">
            {LANG["user_login.user_service"]}
          </Link>
        </div>
        <div className={styles.help}>
          <span>{LANG["user_login.login_help"]}</span>
          <Link scroll={true} href="/company/contact">
            {LANG["user_login.contact_us"]}
          </Link>
        </div>
      </main>
    </div>
  );
}
