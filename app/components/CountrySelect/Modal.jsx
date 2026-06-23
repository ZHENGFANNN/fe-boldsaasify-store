import React from "react";
import ReactDOM from "react-dom";
import GlobalContext from "@/[locale]/context";
import { countryList } from "@/config/marketSettings";
import CountryPickerList from "./CountryPickerList";
import Cookie from "js-cookie";
import styles from "./modal.module.scss";
import { useRouter } from "next/navigation";

function Modal(_, ref) {
  const [isMounted, setIsMounted] = React.useState(false);
  const [show, setShow] = React.useState(false);
  const { LANG } = React.useContext(GlobalContext);
  const router = useRouter();
  const [lock, setLock] = React.useState(false);

  React.useImperativeHandle(ref, () => ({
    show: () => {
      const $areaModalDom = document.querySelector("[data-role='area-modal']");
      if ($areaModalDom) {
        $areaModalDom.setAttribute("data-show", "true");
      } else {
        setIsMounted(true);
        setTimeout(() => setShow(true), 0);
      }
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

  const handleSelectCountry = (countryItem) => {
    if (lock) return;
    setLock(true);
    const expires = new Date(Date.now() + 720 * 24 * 60 * 60 * 1000);
    Cookie.set("area", countryItem.country_code, {
      path: "/",
      expires,
    });
    router.refresh();
    setShow(false);
    setLock(false);
  };

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
