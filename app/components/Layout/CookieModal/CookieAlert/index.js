import React from "react";
import styles from "./index.module.scss";
import GlobalContext from "@/[locale]/context";
import { COOKIE_ALERT_REGION_LIST } from "@/components/Layout/CookieModal/const";
import { setCookieConsent } from "@/hooks/useCookieConsent";
import { track } from "@/utils/analytics";

function CookieSetting({ showCookieSetting }, ref) {
  const { LANG, area, areaReady } = React.useContext(GlobalContext);
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

  // 写偏好并广播（setCookieConsent 内部 localStorage + dispatch），使脚本 gate 即时响应。
  const setCookiePermissions = React.useCallback((list) => {
    setCookieConsent(list);
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
    // 必须等 area cookie 就绪再判：useArea 首帧 area=undefined、mount 后才填，
    // 否则本 effect（原 [] 依赖）在 area 未就绪时判 includes(undefined)=false → 横幅永不弹。
    if (!areaReady) return;
    const cookiePermissionsList = localStorage.getItem(
      "cookie_permissions_list"
    );
    // 无 area cookie 时按站点默认 us（与 BottomModule/readClientArea 一致），否则横幅对默认访客不弹。
    const effectiveArea = area || "us";
    if (
      !cookiePermissionsList &&
      COOKIE_ALERT_REGION_LIST.includes(effectiveArea)
    ) {
      const timer = setTimeout(() => {
        track("cookie-alert-view");
        setFirstRender(false);
        setTimeout(() => {
          setShow(true);
        }, 100);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [areaReady, area]);

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
