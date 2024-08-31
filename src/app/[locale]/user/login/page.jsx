/** @format */

import Link from "next/link";
import React from "react";
import styles from "./page.module.scss";
import getConfigData from "@/utils/getConfigData";
import LoginForm from "./components/LoginForm";

export const runtime = "edge";

async function getData({ locale }) {
  const result = await getConfigData({
    locale,
    configList: ["config", "language"],
    languageNameSpace: ["www.user_login"],
    configNameSpace: ["company.basic.company_name", "company.basic.logo"],
  });
  return result;
}

export async function generateMetadata({ params: { locale } }) {
  const { LANG, CONFIG } = await getData({
    locale,
  });
  return {
    title: `${CONFIG["company.basic.company_name"]} - ${LANG["www.user_login.title"]}`,
    description: LANG["www.user_login.description"],
    keywords: LANG["www.user_login.keywords"],
  };
}

export default async function Login({ params: { locale } }) {
  const { LANG, CONFIG } = await getData({
    locale,
  });
  return (
    <div
      className={styles.container}
      style={{
        backgroundImage: `url(${process.env.NEXT_PUBLIC_FILE}/image/icon/bg.webp)`,
      }}
    >
      <main className={styles.main}>
        <img
          alt={CONFIG["company.basic.company_name"]}
          src={CONFIG["company.basic.logo"]}
          width={40}
          height={40}
        />
        <h1 className={styles.title}>{LANG["www.user_login.login_title"]}</h1>
        <LoginForm LANG={LANG} CONFIG={CONFIG} />

        {/* TODO： 第三方登录 */}
        {/* <div className={styles.other_login_title}>
            <div className={styles.line}></div>
            <div className={styles.other_login_text}>{LANG['www.user_login.other_login']}</div>
            <div className={styles.line}></div>
        </div>

        <div className={styles.other_login_content}>
            <div className={styles.login_items}>
                <img alt="微信" width={20} height={20} src="https://static.insta360.com/assets/storage/20200417/95c2c0c3f8ffb37a3a88af4eccf633eb/mobiel_footer_ic_socialmedia_bilibili.svg" />
            </div>
            <div className={styles.login_items}>
                <img alt="微信" width={20} height={20} src="https://static.insta360.com/assets/storage/20200417/95c2c0c3f8ffb37a3a88af4eccf633eb/mobiel_footer_ic_socialmedia_bilibili.svg" />
            </div>
            <div className={styles.login_items}>
                <img alt="微信" width={20} height={20} src="https://static.insta360.com/assets/storage/20200417/95c2c0c3f8ffb37a3a88af4eccf633eb/mobiel_footer_ic_socialmedia_bilibili.svg" />
            </div>
            <div className={styles.login_items}>
                <img alt="微信" width={20} height={20} src="https://static.insta360.com/assets/storage/20200417/95c2c0c3f8ffb37a3a88af4eccf633eb/mobiel_footer_ic_socialmedia_bilibili.svg" />
            </div>
        </div> */}
        <div className={styles.agreen}>
          <span>{LANG["www.user_login.countinue_agree"]}</span>
          <Link scroll={true} href="/protocol/policy">
            {LANG["www.user_login.privacy_policy"]}
          </Link>
          <span>{LANG["www.user_login.and"]}</span>
          <Link scroll={true} href="/protocol/user">
            {LANG["www.user_login.user_service"]}
          </Link>
        </div>
        <div className={styles.help}>
          <span>{LANG["www.user_login.login_help"]}</span>
          <Link scroll={true} href="/company/contact">
            {LANG["www.user_login.contact_us"]}
          </Link>
        </div>
      </main>
    </div>
  );
}
