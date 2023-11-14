import React from "react";
import styles from "./index.module.scss";
import COUNTRYLIST from "@/config/COUNTRYLIST";
import LANGUAGES from "@/config/LANGUAGE";
import dynamic from "next/dynamic";
import GlobalContext from "@/context";

const Modal = dynamic(() => import("./Modal"), { ssr: false });

function CountryList({ children, LANG }) {
  const [show, setShow] = React.useState(false);
  const [value, setValue] = React.useState(null);

  const { area = "cn" } = {};

  React.useEffect(() => {
    if (show) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "scroll";
    }
  }, [show]);

  React.useEffect(() => {
    const text = `${COUNTRYLIST("map")[area]?.country}  ( ${
      LANGUAGES("map")[COUNTRYLIST("map")[area]?.language_code]?.label
    } / ${COUNTRYLIST("map")[area]?.currency_symbol}${
      COUNTRYLIST("map")[area]?.currency
    } )`;
    setValue(text);
  }, []);

  return (
    <>
      <div className={styles.input_item} onClick={() => setShow(true)}>
        {children ? (
          React.cloneElement(children, { value })
        ) : (
          <>
            <svg
              style={{
                opacity: 0,
                position: "fixed",
                left: "-1000px",
                top: "-1000px",
              }}
            >
              <defs>
                <filter id="headerLanguageIcon">
                  <feFlood
                    floodColor="rgba(0, 0, 0, 0.7)"
                    floodOpacity="1"
                    result="color"
                  />
                  <feComposite in="color" in2="SourceGraphic" operator="in" />
                </filter>
              </defs>
            </svg>
            <img
              style={{
                filter: "url('#headerLanguageIcon')",
              }}
              alt="languages"
              width={24}
              height={24}
              src={`${process.env.NEXT_PUBLIC_IMAGE}/icon/min-languages.svg`}
            />
            <div>{value}</div>
          </>
        )}
      </div>
      <Modal
        LANG={LANG}
        languageMap={LANGUAGES("map")}
        setValue={setValue}
        setShow={setShow}
        show={show}
      />
    </>
  );
}

export default CountryList;
