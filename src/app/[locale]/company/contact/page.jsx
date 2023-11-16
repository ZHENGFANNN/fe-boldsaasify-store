import Link from "next/link";
import { contactList } from "./config";
import { ISEMAIL } from "@/utils/pattern";
import styles from "./page.module.scss";
import Head from "next/head";
import getAllConfigData from "@/utils/getAllConfigData";

export const runtime = "edge";

export async function generateMetadata({ params: { locale } }) {
  const { LANG, CONFIG } = await getAllConfigData(locale);
  return {
    title: `${CONFIG["company.basic.company_name"]} - ${LANG["www.company_contact.title"]}`,
    description: LANG["www.company_contact.description"],
    keywords: LANG["www.company_contact.keywords"],
  };
}

export default async function Contact({ params: { locale } }) {
  const { LANG, CONFIG } = await getAllConfigData(locale);
  return (
    <div className={styles.container}>
      <div className={styles.img_container}>
        <img
          alt={LANG["www.company_contact.contact_us"]}
          src="https://image.sslfly.com/base/2023/4/5/E81C2DEC5F93608243E2D989B3778CB6/contact_us.jpg"
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
                {ISEMAIL.exec(item.content) ? (
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
