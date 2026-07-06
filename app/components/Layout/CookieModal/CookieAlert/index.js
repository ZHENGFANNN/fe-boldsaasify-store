import React from "react";
import styles from "./index.module.scss";
import GlobalContext from "@/[locale]/context";
import { COOKIE_ALERT_REGION_LIST } from "@/components/Layout/CookieModal/const";
import { track } from "@/utils/analytics";

function CookieSetting({ showCookieSetting }, ref) {
  const { LANG, area } = React.useContext(GlobalContext);
  const contentRef = React.useRef();
  const [show, setShow] = React.useState(false);
  const [firstRender, setFirstRender] = React.useState(true);
  const cookieModalRef = React.useRef();

  React.useEffect(() => {
    if (!firstRender && contentRef.current) {
      const observer = new MutationObserver(() => {
        const $domList = contentRef.current.querySelectorAll("[data-key]");
        $domList.forEach(($dom) => {
          $dom.addEventListener("click", handleClick);
        });
      });

      observer.observe(contentRef.current, { childList: true, subtree: true });

      return () => {
        observer.disconnect();
      };
    }
  }, [firstRender, contentRef]);

  const handleClick = (e) => {
    const key = e.target.getAttribute("data-key");
    if (key === "cookie-preferences") {
      showCookieSetting();
    }
    // 上报走 data-event 冒泡，见 dangerouslySetInnerHTML 内的属性
  };

  const setCookiePermissions = React.useCallback((list) => {
    localStorage.setItem("cookie_permissions_list", JSON.stringify(list));
  }, []);

  React.useImperativeHandle(ref, () => ({
    show: () => {
      setFirstRender(false);
      setTimeout(() => {
        setShow(true);
      }, 0);
    },
    close: () => {
      setShow(false);
    },
  }));

  React.useEffect(() => {
    const cookiePermissionsList = localStorage.getItem(
      "cookie_permissions_list"
    );
    if (!cookiePermissionsList && COOKIE_ALERT_REGION_LIST.includes(area)) {
      setTimeout(() => {
        track("cookie-alert-view");
        setFirstRender(false);
        setTimeout(() => {
          setShow(true);
        }, 100);
      }, 3000);
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
                  `<a data-key='cookie-preferences' data-event='cookie-alert-setting-preferences'>${LANG["common.cookie.cookie_perferences"]}</a>`
                )
                ?.replace(
                  "$2",
                  `<a data-key='cookie-policy' data-event='cookie-alert-setting-policy'>${LANG["common.cookie.cookie_policy"]}</a>`
                ),
            }}
          />
        </div>
        <div className={styles.btn_container}>
          <div
            className={[styles.required_btn, styles.btn].join(" ")}
            data-event="cookie-alert-btn-required-only"
            onClick={() => {
              setShow(false);
              setCookiePermissions([]);
            }}
          >
            {LANG["common.cookie.cookie_alert.required_only"]}
          </div>
          <div
            className={[styles.accept_btn, styles.btn].join(" ")}
            data-event="cookie-alert-btn-accept-all"
            onClick={() => {
              setShow(false);
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
