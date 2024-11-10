import React from "react";
import styles from "./index.module.scss";
import GlobalContext from "@/[locale]/context";
import { COOKIE_ALERT_REGION_LIST } from "@/components/Layout/CookieModal/const";
import { trackingCustomClick } from "@/utils";

function CookieSetting({ showCookieSetting }, ref) {
  const { LANG, area } = React.useContext(GlobalContext);
  const contentRef = React.useRef();
  const [show, setShow] = React.useState(false);
  const [firstRender, setFirstRender] = React.useState(true);
  const cookieModalRef = React.useRef();

  React.useEffect(() => {
    if (!firstRender && contentRef.current) {
      const $domList = contentRef.current.querySelectorAll("[data-key]");
      for (let i = 0; i < $domList.length; i++) {
        $domList[i].addEventListener("click", (e) => {
          e.preventDefault();
          const key = $domList[i].getAttribute("data-key");
          if (key === "cookie-preferences") {
            trackingCustomClick("cookie-alert-setting-preferences");
            showCookieSetting();
          } else if (key === "cookie-policy") {
            trackingCustomClick("cookie-alert-setting-policy");
          }
        });
      }
    }
  }, [firstRender]);

  const setCookiePermissions = React.useCallback((list) => {
    localStorage.setItem("cookie_permissions_list", JSON.stringify(list));
  }, []);

  React.useImperativeHandle(ref, () => ({
    show: () => {
      setFirstRender(false);
      setShow(true);
    },
  }));

  React.useEffect(() => {
    const cookiePermissionsList = localStorage.getItem(
      "cookie_permissions_list"
    );
    if (!cookiePermissionsList && COOKIE_ALERT_REGION_LIST.includes(area)) {
      setTimeout(() => {
        trackingCustomClick("cookie-alert-view");
        setFirstRender(false);
        setShow(true);
      }, 3000)
    }
  }, []);

  if (firstRender) return null;

  return (
    <div className={styles.modal} data-show={show} ref={cookieModalRef}>
      <div className={styles.container}>
        <div className={styles.content}>
          <div className={styles.title}>
            {LANG["common.cookie.cookie_alert.title"]}
          </div>
          <div
            ref={contentRef}
            className={styles.desc}
            dangerouslySetInnerHTML={{
              __html: LANG["common.cookie.cookie_alert.content"]
                ?.replace(
                  "$1",
                  `<a data-key='cookie-preferences'>${LANG["common.cookie.cookie_perferences"]}</a>`
                )
                ?.replace(
                  "$2",
                  `<a data-key='cookie-policy'>${LANG["common.cookie.cookie_policy"]}</a>`
                ),
            }}
          />
        </div>
        <div className={styles.btn_container}>
          <div
            className={[styles.required_btn, styles.btn].join(" ")}
            onClick={() => {
              setShow(false);
              trackingCustomClick("cookie-alert-btn-required-only");
              setCookiePermissions([]);
            }}
          >
            {LANG["common.cookie.cookie_alert.required_only"]}
          </div>
          <div
            className={[styles.accept_btn, styles.btn].join(" ")}
            onClick={() => {
              setShow(false);
              trackingCustomClick("cookie-alert-btn-accept-all");
              setCookiePermissions(["functional", "analytical", "marketing"]);
            }}
          >
            {LANG["common.cookie.cookie_alert.accept_all"]}
          </div>
        </div>
      </div>
    </div>
  );
}

export default React.forwardRef(CookieSetting);
