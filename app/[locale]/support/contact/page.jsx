import React from "react";
import styles from "./page.module.scss";
import getRemoteLanguage from "@/config/Api/getRemoteLanguage";
import getRemoteConfig from "@/config/Api/getRemoteConfig";
import { buildAlternates } from "@/config/seo";
import ContactForm from "./components/ContactForm";

async function getData({ locale }) {
  const [LANG, CONFIG] = await Promise.all([
    getRemoteLanguage({ locale, nameSpace: ["www.company_contact"] }),
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
    title: `${CONFIG["common.base"]?.company_name} - ${LANG["www.company_contact.title"]}`,
    description: LANG["www.company_contact.description"],
    keywords: LANG["www.company_contact.keywords"],
    alternates: buildAlternates("/support/contact", locale),
  };
}

export default async function Contact() {
  return (
    <div className={styles.container}>
      <ContactForm />
    </div>
  );
}
