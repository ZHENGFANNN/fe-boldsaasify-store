/** @format */

import React from "react";
import ReactDOM from "react-dom";
import GlobalContext from "@/[locale]/context";
import Link from "next/link";
import { countryList } from "@/config/COUNTRY";
import Cookie from "js-cookie";
import styles from "./modal.module.scss";
import { useRouter } from "next/navigation";

export default function Modal({ show, setShow, languageMap }) {
  const { locale, LANG } = React.useContext(GlobalContext);
  const router = useRouter();
  const [lock, setLock] = React.useState(false);
  return (
    <>
      {ReactDOM.createPortal(
        <div
          className={`${styles.modal}`}
          data-show={show}
          onClick={() => {
            setShow(false);
          }}
        >
          <div className={styles.modal_wrapper}>
            <div
              className={styles.modal_content}
              onClick={(e) => {
                e.stopPropagation();
              }}
            >
              <div className={styles.header}>
                <div className={styles.title}>
                  {LANG["common.other.please_select_area"]}
                </div>
                <div className={styles.close} onClick={() => setShow(false)}>
                  ×
                </div>
              </div>
              <div className={styles.conutry_container}>
                <div className={styles.tip}>
                  {LANG["common.other.not_area_list"]}{" "}
                  <Link scroll={true} target="_blank" href="/company/contact">
                    {LANG["common.other.contact_us"]}
                  </Link>
                </div>
                {countryList.map((item, index) => {
                  return (
                    <div className={styles.area_container} key={index}>
                      <h2>{item[locale]}</h2>
                      <div className={styles.country_list}>
                        {item.countries.map((countryItem, countryIndex) => {
                          return (
                            <div
                              className={styles.country_item}
                              key={countryIndex}
                              onClick={() => {
                                // 不锁定，Facebook会导致重复重定向，导致404
                                if (lock) return;
                                setLock(true);
                                const expires = new Date(
                                  Date.now() + 720 * 24 * 60 * 60 * 1000
                                );
                                Cookie.set("area", countryItem.country_code, {
                                  path: "/",
                                  expires,
                                });
                                Cookie.set(
                                  "locale",
                                  countryItem.language_code,
                                  {
                                    path: "/",
                                    expires,
                                  }
                                );
                                router.refresh({
                                  locale: countryItem.language_code,
                                });
                                setShow(false);
                                setLock(false);
                              }}
                            >
                              {`${countryItem.country}  ( ${
                                languageMap[countryItem.language_code].label
                              } / ${countryItem.currency_symbol}${
                                countryItem.currency
                              } )`}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
