/** @format */

import Link from "next/link";
import styles from "./page.module.scss";
import React from "react";
import getConfigData from "../../../utils/getConfigData";
import RegisterForm from "./components/RegisterForm";
import GoogleLoginPanel from "@/components/GoogleAuth/GoogleLoginPanel";

async function getData({ locale }) {
  const result = await getConfigData({
    locale,
    configList: ["config", "language"],
    languageNameSpace: ["user_register"],
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
    title: `${CONFIG["common.base"]?.company_name} - ${LANG["user_register.title"]}`,
    description: LANG["user_register.description"],
    keywords: LANG["user_register.keywords"],
  };
}

export default async function Register({ params }) {
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
        <h1 className={styles.title}>
          {LANG["user_register.regsiter_title"]}
        </h1>
        <RegisterForm LANG={LANG} />
        <GoogleLoginPanel
          label={LANG["user_register.other_login"]}
          successText={LANG["user_register.register_success"]}
          errorText={LANG["user_register.tip_service_exception"]}
        />
        <p className={styles.register}>
          <span>{LANG["user_register.already_account"]}</span>
          <Link scroll={true} href="/user/login">
            {LANG["user_register.login_now"]}
          </Link>
        </p>
        <div className={styles.agreen}>
          <span>{LANG["user_register.contiuning_agree"]}</span>
          <Link scroll={true} href="/protocol/policy">
            {LANG["user_register.privacy_policy"]}
          </Link>
          <span>{LANG["user_register.and"]}</span>
          <Link scroll={true} href="/protocol/user">
            {LANG["user_register.user_service"]}
          </Link>
        </div>
        <div className={styles.help}>
          <span>{LANG["user_register.help_registration"]}</span>
          <Link scroll={true} href="/company/contact">
            {LANG["user_register.contact_us"]}
          </Link>
        </div>
      </main>
    </div>
  );
}
