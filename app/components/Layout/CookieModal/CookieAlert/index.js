import React from "react";
import styles from "./index.module.scss";
import GlobalContext from "@/[locale]/context";
import { COOKIE_ALERT_REGION_LIST } from "@/components/Layout/CookieModal/const";

function CookieSetting({ showCookieSetting }, ref) {
  const { area } = React.useContext(GlobalContext);
  const [show, setShow] = React.useState(false);
  const [firstRender, setFirstRender] = React.useState(true);
  const cookieModalRef = React.useRef();

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
      setFirstRender(false);
      setShow(true);
    }
  }, []);

  if (firstRender) return null;

  return (
    <div className={styles.modal} data-show={show} ref={cookieModalRef}>
      <div className={styles.container}>
        <div className={styles.content}>
          <div className={styles.title}>We Value Your Privacy</div>
          <div className={styles.desc}>
            We use cookies to personalize and enhance your browsing experience
            on our websites. You can manage your settings at any time through
            <a onClick={showCookieSetting}> Cookie Preferences </a> or read our
            <a> Cookie Policy</a> to learn more.
          </div>
        </div>
        <div className={styles.btn_container}>
          <div
            className={[styles.required_btn, styles.btn].join(" ")}
            onClick={() => {
              setShow(false);
              setCookiePermissions([]);
            }}
          >
            Required Only
          </div>
          <div
            className={[styles.accept_btn, styles.btn].join(" ")}
            onClick={() => {
              setCookiePermissions(["functional", "analytical", "marketing"]);
              setShow(false);
            }}
          >
            Accept All
          </div>
        </div>
      </div>
    </div>
  );
}

export default React.forwardRef(CookieSetting);
