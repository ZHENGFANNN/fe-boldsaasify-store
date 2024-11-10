import React from "react";
import ReactDOM from "react-dom";
import GlobalContext from "@/[locale]/context";
import Link from "next/link";
import { countryList } from "@/config/COUNTRY";
import Cookie from "js-cookie";
import styles from "./index.module.scss";
import { languageMap } from "@/config/LANGUAGE";
import { useRouter } from "next/navigation";
import { trackingCustomClick } from "@/utils";
import { FormSwitch } from "@/components/Form";

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

function Modal(_, ref) {
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
            <div className={styles.title}>Cookie Settings</div>
            <div className={styles.tip}>
              Cookies are small files which, when placed on your device, enable
              us to provide certain features and functionality of websites and
              online services to you. We use the following types of cookies on
              our websites. View Cookie Policy for full details.
            </div>
            <div className={styles.close} onClick={() => setShow(false)}>
              ×
            </div>
          </div>
          <div className={styles.content}>
            <CookieItem
              title="Essential Cookies"
              content="These cookies are necessary for you to use our website and cannot be switched off in our systems. Essential cookies are required to enable the basic functions of this site and guarantee the security and efficiency of the service required. These cookies are usually set in response to actions made by you which amount to a request for services, such as logging in, requesting website visual elements and pages resources, filling in forms or adding goods to the shopping cart. Without these cookies, services you have asked for cannot be properly provided."
              cookieKey="essential"
              openList={openList}
              setOpenList={setOpenList}
              checkList={checkList}
              setCheckList={setCheckList}
              openText={"Always Active"}
            />
            <CookieItem
              title="Functionality Cookies"
              content="These cookies are used to provide you with enhanced functionality and improve your browsing experience. These cookies may remember certain choices you have made, such as your language preference, your region, your username and password. These cookies may be set by us or by third-party providers who provide services on our pages. If you do not allow these cookies, some of these services may not function properly, and we may not be able to provide you with better personalization on user experience."
              cookieKey="functional"
              openList={openList}
              setOpenList={setOpenList}
              checkList={checkList}
              setCheckList={setCheckList}
            />
            <CookieItem
              title="Analytical Cookies"
              content="These cookies allow us to count visits and traffic sources so we can measure and improve the performance of our site. These cookies may collect information about how you use our websites, such as which page you visit and which link you click on. These cookies help us to know which goods or pages are the most and least popular and see how visitors move around the website. These cookies also help us understand how our services are doing and improve them by developing new features. If you do not allow these cookies, we may not be able to monitor its performance and improve your experience accordingly."
              cookieKey="analytical"
              openList={openList}
              setOpenList={setOpenList}
              checkList={checkList}
              setCheckList={setCheckList}
            />
            <CookieItem
              title="Marketing Cookies"
              content="These cookies can track your online activities and are used to make advertisements more relevant to you. These cookies may be set through our website by our advertising partners, which can be used to build a profile of your interests and show you relevant advertisements. If you do not allow these cookies, you will experience less targeted advertising."
              cookieKey="marketing"
              openList={openList}
              setOpenList={setOpenList}
              checkList={checkList}
              setCheckList={setCheckList}
            />
            <div className={styles.btn_container}>
              <div
                className={styles.btn}
                onClick={() => {
                  localStorage.setItem(
                    "cookie_deny_list",
                    JSON.stringify(checkList)
                  );
                  setShow(false);
                }}
              >
                Save My Settings
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default React.forwardRef(Modal);
