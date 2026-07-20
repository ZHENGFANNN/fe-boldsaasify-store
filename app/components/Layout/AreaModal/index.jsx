import React from "react";
import ReactDOM from "react-dom";
import GlobalContext from "@/[locale]/context";
import { countryList } from "@/config/marketSettings";
import CountryPickerList from "@/components/CountrySelect/CountryPickerList";
import LanguagePicker from "@/components/LanguagePicker";
import { saveAreaPref } from "@/utils/localePrefs";
import styles from "./index.module.scss";
import { track } from "@/utils/analytics";

const areaSectionTitleMap = {
  en: "Country / Region",
  "zh-cn": "国家 / 地区",
  ja: "国 / 地域",
};

function Modal(_, ref) {
  const [isMounted, setIsMounted] = React.useState(false);
  const [show, setShow] = React.useState(false);
  const { LANG, locale } = React.useContext(GlobalContext);
  const [lock, setLock] = React.useState(false);
  const [changeBodyScroll, setChangeBodyScroll] = React.useState(true);

  React.useImperativeHandle(ref, () => ({
    show: () => {
      setIsMounted(true);
      setTimeout(() => setShow(true), 0);
    },
  }));

  React.useEffect(() => {
    if (show) {
      setIsMounted(true);
      if (document.body.style.overflow === "hidden") {
        setChangeBodyScroll(false);
      }
      document.body.style.overflow = "hidden";
    } else {
      if (changeBodyScroll) {
        document.body.style.overflow = "scroll";
      } else {
        setChangeBodyScroll(true);
      }
    }
  }, [show]);

  const handleSelectCountry = (countryItem) => {
    if (lock) return;
    setLock(true);
    track("AreaModal", { countryCode: countryItem.country_code });
    // 统一走 saveAreaPref：写 area cookie（加固 Secure/SameSite）并镜像 localStorage
    saveAreaPref(countryItem.country_code);
    location.reload();
    setShow(false);
    setLock(false);
  };

  if (!isMounted) return null;

  return ReactDOM.createPortal(
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
            <LanguagePicker onAfterSelect={() => setShow(false)} />
            <div className={styles.area_section_title}>
              {areaSectionTitleMap[locale] || areaSectionTitleMap.en}
            </div>
            <CountryPickerList
              countries={countryList}
              onSelect={handleSelectCountry}
              styles={styles}
              lock={lock}
            />
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default React.forwardRef(Modal);
