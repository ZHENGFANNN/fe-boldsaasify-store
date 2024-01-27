import Link from "next/link";
import styles from "./page.module.scss";
import React from "react";
import getConfigDataV2 from "@/utils/getConfigDataV2";
import RegisterForm from "./components/RegisterForm";

export const runtime = "edge";
export async function generateMetadata({ params: { locale } }) {
  const { LANG, CONFIG } = await getConfigDataV2({
    locale,
    configList: ["config", "language"],
  });
  return {
    title: `${CONFIG["company.basic.company_name"]} - ${LANG["www.user_register.title"]}`,
    description: LANG["www.user_register.description"],
    keywords: LANG["www.user_register.keywords"],
  };
}

export default async function Register({ params: { locale } }) {
  const { LANG, CONFIG } = await getConfigDataV2({
    locale,
    configList: ["config", "language"],
  });
  return (
    <div
      className={styles.container}
      style={{
        backgroundImage: `url(${process.env.NEXT_PUBLIC_IMAGE}/icon/bg.webp)`,
      }}
    >
      <main className={styles.main}>
        <img
          alt={CONFIG["company.basic.company_name"]}
          src={CONFIG["company.basic.logo"]}
          width={40}
          height={40}
        />
        <h1 className={styles.title}>
          {LANG["www.user_register.regsiter_title"]}
        </h1>
        <RegisterForm LANG={LANG} />
        <p className={styles.register}>
          <span>{LANG["www.user_register.already_account"]}</span>
          <Link href="/user/login">{LANG["www.user_register.login_now"]}</Link>
        </p>
        <div className={styles.agreen}>
          <span>{LANG["www.user_register.contiuning_agree"]}</span>
          <Link href="/protocol/policy">
            {LANG["www.user_register.privacy_policy"]}
          </Link>
          <span>{LANG["www.user_register.and"]}</span>
          <Link href="/protocol/user">
            {LANG["www.user_register.user_service"]}
          </Link>
        </div>
        <div className={styles.help}>
          <span>{LANG["www.user_register.help_registration"]}</span>
          <Link href="/company/contact">
            {LANG["www.user_register.contact_us"]}
          </Link>
        </div>
      </main>
    </div>
  );
}
