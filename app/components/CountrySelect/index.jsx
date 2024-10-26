import React from "react";
import GlobalContext from "@/[locale]/context";

import { countryMap } from "@/config/COUNTRY";
import { languageMap } from "@/config/LANGUAGE";

import dynamic from "next/dynamic";
const Modal = dynamic(() => import("./Modal"), { ssr: false });

import styles from "./index.module.scss";

function CountryList({ children }) {
  const { area } = React.useContext(GlobalContext);
  const [show, setShow] = React.useState(false);
  React.useEffect(() => {
    if (show) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "scroll";
    }
  }, [show]);

  const countryText = React.useMemo(() => {
    return `${countryMap[area]?.country} (${
      languageMap[countryMap[area]?.language_code]?.label
    } / ${countryMap[area]?.currency_symbol}${countryMap[area]?.currency})`;
  }, [area]);

  return (
    <>
      <div className={styles.input_item} onClick={() => setShow(true)}>
        {children ? (
          React.cloneElement(children, { value: countryText })
        ) : (
          <>
            {/* <img src="https://cdn.shopify.com/static/images/flags/us.svg?width=20" /> */}
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
              src={`${process.env.NEXT_PUBLIC_FILE}/image/icon/min-languages.svg`}
            />
            <div>{countryText}</div>
          </>
        )}
      </div>
      <Modal languageMap={languageMap} setShow={setShow} show={show} />
    </>
  );
}

export default CountryList;
