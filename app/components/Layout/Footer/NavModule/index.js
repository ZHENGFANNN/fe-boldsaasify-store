"use client";

import React from "react";
import GlobalContext from "@/[locale]/context";
import Link from "next/link";

import TipModal from "@/components/Modal/FunctionTipModal";

import styles from "./index.module.scss";

function useFooterConfig() {
  const { CONFIG } = React.useContext(GlobalContext);
  const { title, content, footerList: configFooterList } =
    CONFIG["common.footer_nav"] || {};

  // 页脚导航全面配置化：只读 CONFIG["common.footer_nav"].footerList，未配置则为空。
  const footerList = React.useMemo(() => {
    if (Array.isArray(configFooterList) && configFooterList.length > 0) {
      return configFooterList.filter((item) => item.title);
    }
    return [];
  }, [configFooterList]);

  return { title, content, footerList };
}

export default function NavModule() {
  const { CONFIG } = React.useContext(GlobalContext);
  const ModalRef = React.useRef(null);
  const { title, content, footerList } = useFooterConfig();
  const [activity, setActivity] = React.useState();

  React.useEffect(() => {
    const $navItemsContainer = document.getElementsByClassName(
      styles.nav_items_container
    );
    if (activity || activity === 0) {
      const $navItems = document.getElementsByClassName(styles.nav_items);
      for (let i = 0; i < $navItemsContainer.length; i++) {
        if (activity === i) {
          $navItemsContainer[activity].style.height =
            $navItems[activity].clientHeight + "px";
        } else {
          $navItemsContainer[i].style.height = 0;
        }
      }
    } else {
      for (let i = 0; i < $navItemsContainer.length; i++) {
        $navItemsContainer[i].style.height = 0;
      }
    }
  }, [activity]);

  return (
    <div className={styles.nav_container}>
      <div className={styles.about_us}>
        {title ? <div className={styles.about_us_title}>{title}</div> : null}
        {content ? (
          <div
            className={styles.about_us_desc}
            dangerouslySetInnerHTML={{ __html: content }}
          />
        ) : null}
      </div>
      <nav className={styles.nav}>
        {footerList.map((item, index) => (
          <div key={item.id || index} className={styles.nav_list}>
            <p
              className={styles.nav_title}
              onClick={() => {
                if (index === activity) {
                  setActivity(null);
                } else {
                  setActivity(index);
                }
              }}
            >
              <span>{item.title}</span>
              <span
                className={
                  styles.mobile_icon +
                  " " +
                  `${activity === index ? styles.active : ""}`
                }
              ></span>
            </p>
            <div className={styles.nav_items_container}>
              <ul className={styles.nav_items}>
                {Array.isArray(item.children) &&
                  item.children.map((navItem, childIndex) => (
                    <li key={navItem.id || childIndex}>
                      <Link
                        scroll={true}
                        href={`${navItem.href}`}
                        onClick={(e) => {
                          if (!navItem.href) {
                            ModalRef.current.showModal();
                            e.preventDefault();
                          }
                        }}
                      >
                        {navItem.sub_title}
                      </Link>
                    </li>
                  ))}
              </ul>
            </div>
          </div>
        ))}
      </nav>
      <TipModal ref={ModalRef} />
    </div>
  );
}
