import React from "react";
import ReactDOM from "react-dom";
import GlobalContext from "@/[locale]/context";
import Link from "next/link";
import { countryList } from "@/config/COUNTRY";
import Cookie from "js-cookie";
import styles from "./index.module.scss";
import { languageMap } from "@/config/LANGUAGE";
import { useRouter } from "next/navigation";

function Modal(_, ref) {
  const [isMounted, setIsMounted] = React.useState(false);
  const [show, setShow] = React.useState(false);
  const { locale, LANG } = React.useContext(GlobalContext);
  const router = useRouter();
  const [lock, setLock] = React.useState(false);

  React.useImperativeHandle(ref, () => ({
    show: () => {
      setIsMounted(true);
      setTimeout(() => setShow(true), 0);
    },
  }));

  React.useEffect(() => {
    if (show) {
      setIsMounted(true);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "scroll";
    }
  }, [show]);

  if (!isMounted) return null;

  return ReactDOM.createPortal(
    <div
      data-role="area-modal"
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
                            Cookie.set("locale", countryItem.language_code, {
                              path: "/",
                              expires,
                            });
                            router.refresh({
                              locale: countryItem.language_code,
                            });
                            setShow(false);
                            setLock(false);
                          }}
                        >
                          <img
                            alt={countryItem.country}
                            src={`${
                              process.env.NEXT_PUBLIC_FILE
                            }/image/icon/flags/${countryItem.country_code.toLowerCase()}.svg`}
                          />
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
  );
}

export default React.forwardRef(Modal);
