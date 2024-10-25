/** @format */

import Link from "next/link";
import { contactList } from "./config";
import { isEmail } from "../../../utils/pattern";
import styles from "./page.module.scss";
import getConfigData from "../../../utils/getConfigData";

export const runtime = "edge";

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
          src={`${process.env.NEXT_PUBLIC_FILE}/image/icon/bg.webp`}
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
                {isEmail.exec(item.content) ? (
                  <a
                    href={"mailto:" + item.content}
                    className={
                      styles.content_row_description + " " + styles.blue
                    }
                  >
                    {item.content}
                  </a>
                ) : item.content?.startsWith("/") ? (
                  <Link
                    scroll={true}
                    href={item.content}
                    className={
                      styles.content_row_description + " " + styles.blue
                    }
                  >
                    {LANG["www.company_contact.click_view"]}
                  </Link>
                ) : (
                  <div className={styles.content_row_description}>
                    {item.content}
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
