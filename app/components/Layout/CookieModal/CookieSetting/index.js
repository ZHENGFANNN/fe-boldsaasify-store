import React from "react";
import ReactDOM from "react-dom";
import GlobalContext from "@/[locale]/context";
import Link from "next/link";
import Cookie from "js-cookie";
import styles from "./index.module.scss";
import { useRouter } from "next/navigation";
import FormSwitch from "@/components/Form/FormSwitch";
import { setCookieConsent } from "@/hooks/useCookieConsent";

function CookieItem({
  title,
  content,
  cookieKey,
  openList,
  setOpenList,
  checkList,
  setCheckList,
  openText = false,
}) {
  return (
    <div
      className={styles.cookie_item}
      data-active={openList.includes(cookieKey)}
    >
      <div className={styles.cookie_row}>
        <div className={styles.row_title}>{title}</div>
        <div className={styles.row_btn}>
          {openText ? (
            openText
          ) : (
            <FormSwitch
              checked={checkList.includes(cookieKey)}
              onChange={() => {
                if (checkList.includes(cookieKey)) {
                  setCheckList(checkList.filter((item) => item !== cookieKey));
                } else {
                  setCheckList([...checkList, cookieKey]);
                }
              }}
            />
          )}
          <div
            onClick={() => {
              if (openList.includes(cookieKey)) {
                setOpenList(openList.filter((item) => item !== cookieKey));
              } else {
                setOpenList([...openList, cookieKey]);
              }
            }}
            className={styles.icon}
          ></div>
        </div>
      </div>
      <div className={styles.cookie_content}>{content}</div>
    </div>
  );
}

function Modal({ onFinish }, ref) {
  const [isMounted, setIsMounted] = React.useState(false);
  const [show, setShow] = React.useState(false);
  const { locale, LANG } = React.useContext(GlobalContext);
  const [changeBodyScroll, setChangeBodyScroll] = React.useState(true);
  const [checkList, setCheckList] = React.useState([
    "functional",
    "analytical",
    "marketing",
  ]);
  const [openList, setOpenList] = React.useState([]);

  React.useImperativeHandle(ref, () => ({
    show: () => {
      setIsMounted(true);
      setTimeout(() => setShow(true), 0);
    },
  }));

  React.useEffect(() => {
    try {
      const cookiePermissionsList = localStorage.getItem(
        "cookie_permissions_list"
      );
      if (cookiePermissionsList) {
        setCheckList(JSON.parse(cookiePermissionsList));
      }
    } catch (error) {
      console.log("[解析Cookie List失败]", error);
    }

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

  const contentRef = React.useRef(null);
  // 上报已通过 dangerouslySetInnerHTML 里的 data-event 属性走冒泡；此处仅保留结构。

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
              {LANG["common.cookie.cookie_setting.title"]}
            </div>
            <div
              className={styles.tip}
              ref={contentRef}
              dangerouslySetInnerHTML={{
                __html: LANG["common.cookie.cookie_setting.desc"]?.replace(
                  "$1",
                  `<a data-key='cookie-policy' data-event='cookie-setting-desc-policy'>${LANG["common.cookie.cookie_policy"]}</a>`
                ),
              }}
            />
            <div className={styles.close} onClick={() => setShow(false)}>
              ×
            </div>
          </div>
          <div className={styles.content}>
            <CookieItem
              title={
                LANG["common.cookie.cookie_setting.essential_cookies_title"]
              }
              content={
                LANG["common.cookie.cookie_setting.essential_cookies_desc"]
              }
              cookieKey="essential"
              openList={openList}
              setOpenList={setOpenList}
              checkList={checkList}
              setCheckList={setCheckList}
              openText={LANG["common.cookie.cookie_setting.always_active"]}
            />
            <CookieItem
              title={
                LANG["common.cookie.cookie_setting.functionality_cookies_title"]
              }
              content={
                LANG["common.cookie.cookie_setting.functionality_cookies_desc"]
              }
              cookieKey="functional"
              openList={openList}
              setOpenList={setOpenList}
              checkList={checkList}
              setCheckList={setCheckList}
            />
            <CookieItem
              title={
                LANG["common.cookie.cookie_setting.analytical_cookies_title"]
              }
              content={
                LANG["common.cookie.cookie_setting.analytical_cookies_desc"]
              }
              cookieKey="analytical"
              openList={openList}
              setOpenList={setOpenList}
              checkList={checkList}
              setCheckList={setCheckList}
            />
            <CookieItem
              title={LANG["common.cookie.cookie_setting.marketing_cookies_tip"]}
              content={
                LANG["common.cookie.cookie_setting.marketing_cookies_desc"]
              }
              cookieKey="marketing"
              openList={openList}
              setOpenList={setOpenList}
              checkList={checkList}
              setCheckList={setCheckList}
            />
          </div>
          <div className={styles.btn_container}>
            <div
              className={styles.btn}
              onClick={() => {
                // 写偏好并广播，脚本 gate 即时按新开关加载/停留。
                setCookieConsent(checkList);
                setShow(false);
                onFinish();
              }}
            >
              {LANG["common.cookie.cookie_setting.save_my_settings"]}
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default React.forwardRef(Modal);
