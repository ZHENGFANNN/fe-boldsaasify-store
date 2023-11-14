"use client";
/**
 * 底部配置
 * 存在安全性问题（表单提交，提交订阅）
 */

import styles from "./index.module.scss";
import React from "react";
import TipModal from "@/components/Modal/FunctionTipModal";
import { ISEMAIL } from "@/utils/pattern";
import CountryList from "@/components/CountrySelect";

import { useRouter } from "next/navigation";

import NAVFUNC from "@/config/NAVFUNC";
import Api from "../api";
import GlobalContext from "@/context";
const FULLYEAR = new Date().getFullYear();

function ShowLanguageItem({ value }) {
  return (
    <div className={styles.show_item}>
      <svg
        style={{
          opacity: 0,
          position: "fixed",
          left: "-1000px",
          top: "-1000px",
        }}
      >
        <defs>
          <filter id="turnIntoRed">
            <feFlood floodColor="#8c8c8c" floodOpacity="1" result="color" />
            <feComposite in="color" in2="SourceGraphic" operator="in" />
          </filter>
        </defs>
      </svg>
      <img
        style={{
          filter: "url('#turnIntoRed')",
        }}
        alt="languages"
        width={24}
        height={24}
        src={`${process.env.NEXT_PUBLIC_IMAGE}/icon/min-languages.svg`}
      />
      <div>{value}</div>
    </div>
  );
}

export default function Footer({
  CONFIG,
  LANG,
  GOODSORTLIST,
  GOODLIST,
  locale,
}) {
  const router = useRouter();
  // const { CONFIG, LANG, GOODSORTLIST, GOODLIST, locale } =
  //   React.useContext(GlobalContext);
  const ModalRef = React.useRef(null);

  const NAVLIST = React.useMemo(() => {
    return NAVFUNC({ LANG, CONFIG, GOODLIST, GOODSORTLIST });
  }, [LANG, CONFIG, GOODLIST, GOODSORTLIST]);

  const [email, setEmail] = React.useState("");
  const [emailStatue, setEmailStatue] = React.useState();
  const [activity, setActivity] = React.useState();

  const onSubmit = async () => {
    if (!email) return;
    if (!ISEMAIL.exec(email)) {
      setEmailStatue("error");
    } else {
      try {
        const data = await Api.subscribeUser({
          email,
          path: location.pathname,
          language: locale,
        });
        if (data.code !== 0) throw new Error("code!==0");
        else setEmailStatue("success");
      } catch (err) {
        setEmailStatue("fail");
      }
    }
  };

  // 处理移动端下拉高度
  React.useEffect(() => {
    const $navItemsContainer = document.getElementsByClassName(
      styles.nav_items_container
    );
    if (activity || activity === 0) {
      const $navItems = document.getElementsByClassName(styles.nav_items);
      for (let i = 0; i < $navItemsContainer.length; i++) {
        if (activity === i) {
          $navItemsContainer[activity].style.height =
            $navItems[activity].clientHeight + "px";
        } else {
          $navItemsContainer[i].style.height = 0;
        }
      }
    } else {
      for (let i = 0; i < $navItemsContainer.length; i++) {
        $navItemsContainer[i].style.height = 0;
      }
    }
  }, [activity]);

  React.useEffect(() => {
    if (emailStatue === "success") {
      const $subModal = document.getElementsByClassName(
        styles.subscription_modal
      )[0];
      document.body.style.overflow = "hidden";
      $subModal.style.display = "block";
      setTimeout(() => {
        $subModal.style.opacity = 1;
      });
      setEmail("");
    }
  }, [emailStatue]);

  return (
    <footer className={styles.container} data-role="footer-info">
      {/* 回到顶部 */}
      <div
        className={styles.mobile_top}
        onClick={() => {
          window.scrollTo({
            left: 0,
            top: 0,
            behavior: "smooth",
          });
        }}
      >
        <div className={styles.arrow_icon}></div>
        <span>{LANG["common.footer.back_top"]}</span>
      </div>
      <nav className={styles.nav}>
        {NAVLIST.map((item, index) => {
          if (item.list.length > 6) {
            item.list.length = 7;
          }
          return (
            <div key={item.key} className={styles.nav_list}>
              <p
                className={styles.nav_title}
                onClick={() => {
                  if (index === activity) {
                    setActivity(null);
                  } else {
                    setActivity(index);
                  }
                }}
              >
                <span>{item.title}</span>
                <span
                  className={
                    styles.mobile_icon +
                    " " +
                    `${activity === index ? styles.active : ""}`
                  }
                ></span>
              </p>
              <ul className={styles.nav_items_container}>
                <div className={styles.nav_items}>
                  {item?.list?.map((nav_items, index) => {
                    return (
                      <li key={index}>
                        {nav_items.href &&
                        !nav_items.href.startsWith("http") ? (
                          <a href={`/${locale}/${nav_items.href}`}>
                            {nav_items.sub_title}
                          </a>
                        ) : (
                          <a
                            onClick={() => {
                              if (nav_items.href) {
                                location.href = nav_items.href;
                              } else {
                                ModalRef.current.showModal();
                              }
                            }}
                          >
                            {nav_items.sub_title}
                          </a>
                        )}
                      </li>
                    );
                  })}
                </div>
              </ul>
            </div>
          );
        })}
      </nav>
      <section className={styles.content}>
        <div className={styles.content_company}>
          <div className={styles.content_logo}>
            {CONFIG["company.social_media.index"]?.map((item, index) => {
              return (
                <div key={index}>
                  {
                    item.href ? (
                      <a
                        key={index}
                        href={item.href}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <img
                          alt={item.alt}
                          width={24}
                          height={24}
                          src={item.src}
                        />
                      </a>
                    ) : null
                    // <a
                    //   key={index}
                    //   onClick={() => {
                    //     ModalRef.current.showModal()
                    //   }}>
                    //   <img alt={item.alt} width={24} height={24} src={item.src} />
                    // </a>
                  }
                </div>
              );
            })}
          </div>
          <div>
            <span>{LANG["common.footer.contact_email"]}：</span>
            <div>{CONFIG["company.basic.customer_service"]}</div>
          </div>
          <time dateTime={CONFIG["company.basic.work_time"]}>
            <span>{LANG["common.footer.work_time"]}：</span>
            <div>{CONFIG["company.basic.work_time"]}</div>
          </time>
          {router.query?.locale === "cn" ? (
            <div>
              <span>备案信息：</span>
              <span>
                <a
                  className={styles.footer_files}
                  target="_blank"
                  rel="noreferrer"
                  href="https://beian.miit.gov.cn/#/Integrated/index"
                >
                  {CONFIG["company.basic.website_beian"]}
                </a>
              </span>
            </div>
          ) : null}
        </div>
        <div className={styles.content_subscription}>
          <h2 className={styles.content_title}>
            {LANG["common.footer.email_subscribe"]}
          </h2>
          <p className={styles.content_description}>
            {LANG["common.footer.subscribe_news"]
              ?.split("${1}")
              .join(CONFIG["company.basic.company_name"])}
          </p>
          <div className={styles.content_email}>
            <div className={styles.content_input_btn}>
              <input
                onFocus={() => setEmailStatue(null)}
                value={email}
                onKeyDown={(e) => {
                  if (e.key === "Enter") onSubmit();
                }}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setEmailStatue();
                }}
                placeholder={LANG["common.footer.email_placeholder"]}
              />
              <button
                onClick={() => {
                  onSubmit();
                }}
                className={email ? styles.active_btn : ""}
              >
                <div className={styles.arrow_icon}></div>
              </button>
            </div>
            {emailStatue === "fail" ? (
              <div className={styles.email_fail}>
                {LANG["common.footer.subscribe_error"]}
              </div>
            ) : null}
            {emailStatue === "error" ? (
              <div className={styles.email_fail}>
                {LANG["common.footer.email_error"]}
              </div>
            ) : null}
          </div>
        </div>
      </section>
      <section className={styles.footer}>
        <div className={styles.footer_container}>
          <div className={styles.footer_copyright}>
            Copyright &copy; <time dateTime={FULLYEAR}>{FULLYEAR}</time>
            {` ${CONFIG["company.basic.company_name"]} `}
            {LANG["common.footer.right_reserved"]}
          </div>
          <div className={styles.footer_filing}>
            <CountryList LANG={LANG}>
              <ShowLanguageItem />
            </CountryList>
          </div>
        </div>
      </section>
      <section className={styles.subscription_modal}>
        <div className={styles.subscription_modal_content}>
          <h2>{LANG["common.footer.subscribe_success"]}</h2>
          <p>
            {LANG["common.footer.subscribe_description"]
              ?.split("${1}")
              .join(CONFIG["company.basic.company_name"])}
          </p>
          <button
            onClick={() => {
              const $subModal = document.getElementsByClassName(
                styles.subscription_modal
              )[0];
              $subModal.style.opacity = 0;
              document.body.style.overflow = "auto";
              setTimeout(() => {
                $subModal.style.display = "none";
              }, 400);
            }}
          >
            {LANG["common.footer.email_confirm"]}
          </button>
        </div>
      </section>
      <TipModal LANG={LANG} ref={ModalRef} />
    </footer>
  );
}
