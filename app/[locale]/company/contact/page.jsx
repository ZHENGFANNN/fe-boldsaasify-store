import React from "react";
import { contactList } from "./config";
import { isEmail } from "../../../utils/pattern";
import styles from "./page.module.scss";
import getConfigData from "../../../utils/getConfigData";
import GlobalContext from "@/[locale]/context";
import Email from "./components/Email";
import Link from "./components/Link";
import Text from "./components/Text";
import Modal from "./components/Modal";

async function getData({ locale }) {
  const result = await getConfigData({
    locale,
    configList: ["config", "language"],
    languageNameSpace: ["www.company_contact"],
    configNameSpace: [
      "company.basic",
      "company.social_media.index",
      "company.basic.company_name",
    ],
  });
  return result;
}

export async function generateMetadata({ params }) {
  const { locale } = await params;
  const { LANG, CONFIG } = await getData({
    locale,
  });
  return {
    title: `${CONFIG["company.basic.company_name"]} - ${LANG["www.company_contact.title"]}`,
    description: LANG["www.company_contact.description"],
    keywords: LANG["www.company_contact.keywords"],
  };
}

export default async function Contact({ params }) {
  const { locale } = await params;
  const { LANG, CONFIG } = await getData({
    locale,
  });
  return (
    <div className={styles.container}>
      <div className={styles.img_container}>
        <img
          alt={LANG["www.company_contact.contact_us"]}
          src={`${process.env.NEXT_PUBLIC_FILE}/common/image/icon/bg.webp`}
        />
      </div>
      <ul className={styles.media_list}>
        {CONFIG["company.social_media.index"]?.map((item, index) => {
          return (
            <li key={index}>
              {item.href ? (
                <a
                  key={index}
                  href={item.href}
                  target="_blank"
                  rel="noreferrer"
                >
                  <img alt={item.alt} width={24} height={24} src={item.src} />
                </a>
              ) : null}
            </li>
          );
        })}
      </ul>
      <ul className={styles.content_container}>
        {contactList({ CONFIG, LANG }).map((item, index) => {
          return (
            <li key={index} className={styles.content_row}>
              <div className={styles.content_row_container}>
                <h3 className={styles.content_row_title}>{item.title}</h3>
                {item.type === "email" ? (
                  <Email styles={styles} item={item} LANG={LANG} />
                ) : null}
                {item.type === "href" ? (
                  <Link styles={styles} item={item} LANG={LANG} />
                ) : null}
                {item.type === "text" ? (
                  <Text styles={styles} item={item} LANG={LANG} />
                ) : null}
                {item.type === "modal" ? (
                  <Modal styles={styles} item={item} LANG={LANG} />
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
