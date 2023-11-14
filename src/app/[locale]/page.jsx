import React from "react";
import Script from "next/script";

import getAllConfigData from "@/utils/getAllConfigData";
import styles from "./page.module.scss";

export const runtime = "edge";

// 首页产品列表
function ProductItem({
  title,
  description,
  href,
  img_title,
  img_src,
  LANG,
  locale,
}) {
  return (
    <div className={styles.main_list_img}>
      {href?.startsWith("http") ? (
        <a href={href} target="_blank" rel="noreferrer"></a>
      ) : (
        <a href={`/${locale}/${href}`}></a>
      )}
      <div className={styles.main_list_text}>
        <div className={styles.main_list_text_title}>{title}</div>
        <div className={styles.main_list_text_description}>{description}</div>
        <div className={styles.main_list_text_buy}>
          <div className={styles.main_list_text_buy_container}>
            <span>{LANG["www.index.buy_now"]}</span>
            <div className={styles.arrow_icon}></div>
          </div>
        </div>
      </div>
      <img alt={img_title} src={img_src} />
    </div>
  );
}

export async function generateMetadata({ params: { locale } }) {
  const { LANG } = await getAllConfigData(locale);
  return {
    title: LANG["www.index.title"],
    description: LANG["www.index.description"],
    keywords: LANG["www.index.keywords"],
  };
}

export default async function Home({ params: { locale } }) {
  const { CONFIG, LANG, GOODLIST } = await getAllConfigData(locale);
  return (
    <div className={styles.container}>
      <main className={styles.main}>
        <section
          className={styles.main_kv}
          style={{
            "--kv-img-pc": `url(${CONFIG["www.index.kv_img_pc"]})`,
            "--kv-img-ipad": `url(${CONFIG["www.index.kv_img_ipad"]})`,
            "--kv-img-mob": `url(${CONFIG["www.index.kv_img_mob"]})`,
          }}
        >
          {CONFIG["www.index.kv_link"]?.startsWith("http") ? (
            <a
              href={CONFIG["www.index.kv_link"]}
              target="_blank"
              rel="noreferrer"
            ></a>
          ) : (
            <a href={`/${locale}/${CONFIG["www.index.kv_link"]}`}></a>
          )}
          <div className={styles.main_kv_text}>
            <div className={styles.main_kv_text_title}>
              {CONFIG["www.index.kv_title"]}
            </div>
            <div className={styles.main_kv_text_description}>
              {CONFIG["www.index.kv_description"]}
            </div>
            <div className={styles.main_kv_text_buy}>
              <div className={styles.main_kv_text_buy_container}>
                <span>{LANG["www.index.buy_now"]}</span>
                <div className={styles.arrow_icon}></div>
              </div>
            </div>
          </div>
        </section>

        <section className={styles.main_list}>
          <div className={styles.main_list_img_container}>
            {CONFIG["www.index.imgs"] &&
              CONFIG["www.index.imgs"]?.map((item, index) => {
                return (
                  <ProductItem
                    key={index}
                    sub_title={item.sub_title}
                    title={item.title}
                    description={item.description}
                    img_title={item.title}
                    img_src={item.src}
                    locale={locale}
                    href={item.href}
                    LANG={LANG}
                  />
                );
              })}
          </div>
        </section>
        <a
          style={{
            "--about-us-mob": `url(${CONFIG["www.index.about_us_img_mob"]})`,
            "--about-us-pc": `url(${CONFIG["www.index.about_us_img_pc"]})`,
          }}
          href={`/${locale}/company/introduce`}
          className={styles.footer_container}
        >
          <div className={styles.footer_content}>
            <h3 className={styles.footer_content_title}>
              {LANG["www.index.about_us"]}
            </h3>
            <div className={styles.footer_content_description_container}>
              <div className={styles.footer_content_description}>
                {LANG["www.index.learn_more"]}
              </div>
              <div className={styles.arrow_icon}></div>
            </div>
          </div>
        </a>
      </main>
      <Script
        id="www-index-ld-json"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            {
              "@context": "https://schema.org",
              "@type": "ItemList",
              itemListElement: GOODLIST.map((item, index) => {
                return {
                  "@type": "ListItem",
                  position: index,
                  item: {
                    "@type": "Course",
                    url: `/store/product/${item.path}`,
                    name: item.name,
                    description: item.description,
                    provider: {
                      "@type": "Organization",
                      name: `${CONFIG["company.basic.company_name"]}`,
                      sameAs: process.env.NEXT_PUBLIC_WWW,
                    },
                  },
                };
              }),
            },
            null,
            "\t"
          ),
        }}
      />
    </div>
  );
}
