/** @format */

"use client";

import React from "react";
import ReactDOM from "react-dom";
import GlobalContext from "../../../[locale]/context";

import { useParams } from "next/navigation";
import { countryList } from "@/config/COUNTRY";
import Input from "../Input";
import Link from "next/link";
import Cookie from "js-cookie";

import styles from "./index.module.scss";

// 临时功能
function CountryModal({
  setValue,
  value,
  inputProps,
  error,
  disabled = false,
}) {
  const { locale, LANG } = React.useContext(GlobalContext);
  const [show, setShow] = React.useState(false);

  React.useEffect(() => {
    if (show) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "scroll";
    }
  }, [show]);

  React.useEffect(() => {
    const area = Cookie.get("area");
    if (area) {
      try {
        countryList.forEach((item) => {
          const data = item.countries.find((item2) => {
            return item2.country_code === area;
          });
          if (data) {
            setValue({
              area_code: data.country_code,
              area_text: data.country,
            });
          }
        });
      } catch (err) {
        console.log(err);
      }
    }
  }, []);

  return (
    <>
      <div
        className={`${styles.input_item} ${disabled ? styles.disabled : ""}`}
        onClick={() => {
          if (!disabled) setShow(true);
        }}
      >
        <Input
          inputProps={{
            ...inputProps,
            disabled: true,
          }}
          focus={!!value}
          error={error}
          label={LANG["common.other.country_region"]}
          tip={LANG["common.other.change_country"]}
        />
      </div>
      {ReactDOM.createPortal(
        <div className={`${styles.modal} ${show ? styles.show : ""}`}>
          <div className={styles.modal_content}>
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
                              setValue({
                                area_code: countryItem.country_code,
                                area_text: countryItem.country,
                              });
                              setShow(false);
                            }}
                          >
                            {`${countryItem.country} / ${countryItem.currency_symbol} ${countryItem.currency}`}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}

export default CountryModal;
