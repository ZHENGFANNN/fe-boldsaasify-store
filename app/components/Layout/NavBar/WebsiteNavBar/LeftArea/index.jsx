import React from "react";
import GlobalContext from "@/[locale]/context";

import NAVFUNC from "@/config/NAVFUNC";
import { countryMap } from "@/config/COUNTRY";
import TipModal from "@/components/Modal/FunctionTipModal";
import Link from "next/link";

import { trackingCustomClick } from "@/utils";

import styles from "./index.module.scss";

export default function LeftArea({ navActive, setNavActive }) {
  const { LANG, CONFIG, BLOG, PRODUCT, showAreaModal, area } =
    React.useContext(GlobalContext);
  const ModalRef = React.useRef(null);
  // Nav Content
  const navListContainerRef = React.useRef(null);
  // 下拉激活
  const [activeKey, setActiveKey] = React.useState();

  const countryText = React.useMemo(() => {
    const currentArea = countryMap[area];
    return `${currentArea.country} (${currentArea.language} / ${currentArea.currency_symbol}${currentArea.currency})`;
  }, []);

  const navList = React.useMemo(() => {
    return NAVFUNC({
      LANG,
      BLOG,
      CONFIG,
      PRODUCT,
      type: "nav",
    });
  }, [LANG, CONFIG, PRODUCT, BLOG]);

  // 逻辑处理
  // 展开导航栏屏幕（小于1080）
  React.useEffect(() => {
    const $mobileNav = navListContainerRef.current;
    if (window.innerWidth > 1080 || !$mobileNav) return;
    if (navActive) {
      $mobileNav.style = `min-height: ${window.innerHeight - 50}px;opacity: 1;`;
      document.body.style = "overflow: hidden";
    } else {
      const $navListDom = navListRef.current;
      for (let i = 0; i < $navListDom.children.length; i++) {
        const $navDom = $navListDom.children[i];
        const $activeNavContentDom = $navDom.querySelector(
          `.${styles.nav_item_content}`
        );
        $activeNavContentDom.style = ``;
      }
      setActiveKey(undefined);
      $mobileNav.style = "";
      document.body.style = "overflow: auto";
    }
  }, [navActive]);

  /* 
    屏幕（大于1080）
  */
  const navListRef = React.useRef(null);
  // 下拉选项
  const [navContentActive, setNavContentActive] = React.useState(false);
  // 下拉高度设置
  React.useEffect(() => {
    if (window.innerWidth <= 1080) return;
    const $navListDom = navListRef.current;
    const $activeNav = $navListDom.querySelector(`[data-active="true"]`);
    if (!$activeNav) return;
    const $activeNavContentDom = $activeNav.querySelector(
      `.${styles.nav_item_content}`
    );
    const $activeNavContentWrapperDom = $activeNav.querySelector(
      `.${styles.nav_item_content_wrapper}`
    );
    const height = $activeNavContentWrapperDom?.clientHeight;

    const $activeNavContentListDom = $navListDom.querySelectorAll(
      `.${styles.nav_item_content}`
    );

    let defaultHeight = 0;
    $activeNavContentListDom.forEach(($navContentDom) => {
      defaultHeight += $navContentDom.clientHeight;
      if (defaultHeight && navContentActive) {
        $navContentDom.style = `transition: none; height: 0; opacity: 0;`;
      } else {
        $navContentDom.style = ` height: 0; opacity: 0;`;
      }
    });

    if (navContentActive) {
      $activeNavContentDom
        .querySelectorAll("[data-src]")
        .forEach(($imageDom) => {
          const src = $imageDom.getAttribute("data-src");
          $imageDom.setAttribute("src", src);
          $imageDom.removeAttribute("data-src");
        });
      if (defaultHeight) {
        $activeNavContentDom.style = `transition: none;height: ${
          height + 60
        }px;opacity: 1;`;
      } else {
        $activeNavContentDom.style = `transition: all 400ms ease-in-out;height: ${
          height + 60
        }px;opacity: 1;`;
      }
    }
  }, [activeKey, navContentActive]);

  // 初始化
  React.useEffect(() => {
    function onResizeChange() {
      // 重置 Style 样式
      const $navListDom = navListRef.current;
      for (let i = 0; i < $navListDom.children.length; i++) {
        const $navDom = $navListDom.children[i];
        const $activeNavContentDom = $navDom.querySelector(
          `.${styles.nav_item_content}`
        );
        $activeNavContentDom.style = ``;
      }
      setActiveKey(undefined);
      setNavContentActive(false);
      setNavActive(false);
      document.body.style = "overflow: auto";
    }

    function onScrollChange() {
      if (window.innerWidth <= 1080) return;
      setNavContentActive(false);
    }

    window.addEventListener("scroll", onScrollChange);
    window.addEventListener("resize", onResizeChange);

    return () => {
      window.removeEventListener("scroll", onScrollChange);
      window.removeEventListener("resize", onResizeChange);
    };
  }, []);

  return (
    <>
      <div className={styles.header_left}>
        {/* 更多ICON */}
        <div
          className={
            styles.header_mobile +
            ` ${navActive ? styles.header_mobile_active : ""}`
          }
          onClick={() => {
            setNavActive((value) => !value);
            trackingCustomClick({ click_type: `NavIcon-MobMore` });
          }}
        >
          <span className={styles.control_icon}></span>
          <span className={styles.control_icon}></span>
          <span className={styles.control_icon}></span>
        </div>
        <div className={styles.header_logo}>
          <Link
            scroll={true}
            href={`/`}
            onClick={() => {
              setNavActive(false);
            }}
          >
            <img alt={"logo"} src={CONFIG["company.basic.logo"]} />
            <div className={styles.name}>
              {CONFIG["company.basic.company_name"]}
            </div>
          </Link>
        </div>
        <div
          ref={navListContainerRef}
          className={
            styles.header_nav +
            ` ${navActive ? styles.header_mobile_height : ""}`
          }
        >
          <ul
            ref={navListRef}
            className={styles.header_nav_list}
            onMouseLeave={() => {
              if (window.innerWidth <= 1080) return;
              setNavContentActive(false);
            }}
          >
            {navList.map((item, index) => {
              return (
                <li
                  key={item.key}
                  data-active={
                    (navContentActive || navActive) && activeKey === item.key
                  }
                >
                  <div
                    onMouseOver={() => {
                      if (window.innerWidth > 1080) {
                        setNavContentActive(true);
                        setActiveKey(item.key);
                      }
                    }}
                    onClick={() => {
                      if (window.innerWidth > 1080) return;
                      const $navListDom = navListRef.current;
                      // Mob Close Nav
                      if (activeKey === item.key) {
                        const $navDom = $navListDom.children[index];
                        const $activeNavContentDom = $navDom.querySelector(
                          `.${styles.nav_item_content}`
                        );
                        setActiveKey(undefined);
                        $activeNavContentDom.style = `transition: all 400ms ease-in-out;height: 0px; opacity: 1;`;
                        return;
                      }

                      // Mob Open Nav
                      for (let i = 0; i < $navListDom.children.length; i++) {
                        const $navDom = $navListDom.children[i];
                        const $activeNavContentDom = $navDom.querySelector(
                          `.${styles.nav_item_content}`
                        );
                        $activeNavContentDom.style = `transition: all 400ms ease-in-out;height: 0px; opacity: 1;`;
                      }

                      const $activeNav = $navListDom.children[index];
                      setActiveKey(item.key);

                      const $activeNavContentDom = $activeNav.querySelector(
                        `.${styles.nav_item_content}`
                      );

                      const $activeNavContentWrapperDom =
                        $activeNav.querySelector(
                          `.${styles.nav_item_content_wrapper}`
                        );

                      const height = $activeNavContentWrapperDom?.clientHeight;
                      $activeNavContentDom.style = `transition: all 400ms ease-in-out;height: ${height}px; opacity: 1;`;

                      $activeNavContentDom
                        .querySelectorAll("[data-src]")
                        .forEach(($imageDom) => {
                          const src = $imageDom.getAttribute("data-src");
                          $imageDom.setAttribute("src", src);
                          $imageDom.removeAttribute("data-src");
                        });
                    }}
                    className={styles.nav_item_title}
                  >
                    <div>{item.title}</div>
                    <div className={styles.mobile_icon}></div>
                  </div>
                  <div
                    className={styles.nav_item_content}
                    onMouseLeave={() => {
                      if (window.innerWidth > 1080) {
                        setNavContentActive(false);
                      }
                    }}
                    onMouseOver={() => {
                      if (window.innerWidth > 1080) {
                        setNavContentActive(true);
                      }
                    }}
                  >
                    <div
                      className={styles.nav_item_content_wrapper}
                      data-list-text={item.key === "blog"}
                    >
                      {item.list.map((navSubItem, navSubIndex) => {
                        return (
                          // 性能优化
                          <div
                            key={navSubIndex}
                            data-active={item.key === activeKey}
                          >
                            {item.key === "blog" ? (
                              <>
                                <NavSubTextItem
                                  lastItem={
                                    navSubIndex === item.list.length - 1
                                  }
                                  href={item.href}
                                  navSubIndex={navSubIndex}
                                  navSubItem={navSubItem}
                                  setNavContentActive={setNavContentActive}
                                  setNavActive={setNavActive}
                                />
                              </>
                            ) : null}
                            {item.key !== "blog" ? (
                              <>
                                <NavSubCommonItem
                                  href={item.href}
                                  navSubIndex={navSubIndex}
                                  navSubItem={navSubItem}
                                  setNavContentActive={setNavContentActive}
                                  setNavActive={setNavActive}
                                  showModal={() => ModalRef.current.showModal()}
                                />
                              </>
                            ) : null}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </li>
              );
            })}
            <li
              key="country-select"
              className={styles.nav_extend_country_select}
              onClick={() => showAreaModal()}
            >
              <div className={styles.nav_item_title}>
                <img
                  alt={countryMap[area].country}
                  src={`${
                    process.env.NEXT_PUBLIC_FILE
                  }/image/icon/flags/${countryMap[
                    area
                  ].country_code.toLowerCase()}.svg`}
                />
                <div>{countryText}</div>
              </div>
              <div className={styles.nav_item_content}></div>
            </li>
          </ul>
        </div>
      </div>
      <TipModal ref={ModalRef} />
    </>
  );
}

// 导航子列表 - Next
function NavSubNextItem({ setNavContentActive, setNavActive, href, type }) {
  const { LANG } = React.useContext(GlobalContext);
  return (
    <Link
      scroll={true}
      onClick={() => {
        setNavContentActive(false);
        setNavActive(false);
      }}
      href={href}
      className={
        type === "img"
          ? styles.nav_item_content_img
          : styles.nav_item_content_text_button
      }
    >
      <img
        alt={LANG["common.nav.learn_more"]}
        data-src={`${process.env.NEXT_PUBLIC_FILE}/image/icon/nav-learn-more.svg`}
      />
      <p>{LANG["common.nav.learn_more"]}</p>
    </Link>
  );
}

// 导航子项列表 -  文本
function NavSubTextItem({
  href,
  lastItem,
  navSubItem,
  navSubIndex,
  setNavContentActive,
  setNavActive,
}) {
  if (navSubIndex > 8) return null;
  return (
    <>
      <Link
        scroll={true}
        onClick={() => {
          setNavContentActive(false);
          setNavActive(false);
        }}
        href={navSubItem.href}
        className={styles.nav_item_content_text}
      >
        {navSubItem.sub_title}
      </Link>
      {navSubIndex === 8 ? (
        <NavSubNextItem
          type="text"
          href={href}
          setNavContentActive={setNavContentActive}
          setNavActive={setNavActive}
        />
      ) : null}
    </>
  );
}

// 导航子项列表 -  图片
function NavSubCommonItem({
  href,
  navSubIndex,
  navSubItem,
  setNavContentActive,
  setNavActive,
  showModal,
}) {
  if (navSubIndex > 15) return null;
  if (navSubIndex === 15)
    return (
      <NavSubNextItem
        type="img"
        href={href}
        setNavContentActive={setNavContentActive}
        setNavActive={setNavActive}
      />
    );
  return (
    <Link
      scroll={true}
      onClick={(e) => {
        setNavContentActive(false);
        setNavActive(false);
        if (!navSubItem.href) {
          showModal();
          e.preventDefault();
        }
      }}
      href={navSubItem.href}
      className={styles.nav_item_content_img}
    >
      <img
        height={60}
        width={60}
        data-src={navSubItem.img}
        alt={navSubItem.sub_title}
      />
      <p>{navSubItem.sub_title}</p>
    </Link>
  );
}
