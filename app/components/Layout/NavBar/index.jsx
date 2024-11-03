/** @format */

"use client";
import React from "react";
import GlobalContext from "@/[locale]/context";

import NAVFUNC from "../../../config/NAVFUNC";
import { countryMap } from "@/config/COUNTRY";
import TipModal from "../../Modal/FunctionTipModal";
import DropSelect from "../../DropSelect";

import Link from "next/link";
import { useRouter } from "next/navigation";

import Api from "../api";
import tracking from "../tracking";

import styles from "./index.module.scss";
import { getJsonData } from "@/utils";

export default function NavBar() {
  const { LANG, CONFIG, BLOG, PRODUCT } = React.useContext(GlobalContext);
  const ModalRef = React.useRef(null);

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
  const [navActive, setNavActive] = React.useState(false);
  React.useEffect(() => {
    if (window.innerWidth > 1080) return;
    if (navActive) {
      headerNavWidthRef.current
        .querySelectorAll("[data-src]")
        .forEach(($imageDom) => {
          const src = $imageDom.getAttribute("data-src");
          $imageDom.setAttribute("src", src);
          $imageDom.removeAttribute("data-src");
        });
      headerNavContentRef.current.style = `opacity: 1;`;
      document.body.style = "overflow: hidden";
    } else {
      document.body.style = "overflow: auto";
    }
  }, [navActive]);
  /* 
    屏幕（大于1080）
  */
  // 下拉激活
  const [hoverActiveKey, setHoverActiveKey] =
    React.useState("product_categories");
  // 下拉选项
  const [navItemActive, setVavItemActive] = React.useState(false);
  // 下拉高度设置
  const headerNavWidthRef = React.useRef(null);
  const headerNavContentRef = React.useRef(null);
  React.useEffect(() => {
    if (window.innerWidth <= 1080) return;
    const height = headerNavWidthRef.current?.clientHeight;
    if (navItemActive) {
      headerNavWidthRef.current
        .querySelectorAll("[data-src]")
        .forEach(($imageDom) => {
          const src = $imageDom.getAttribute("data-src");
          $imageDom.setAttribute("src", src);
          $imageDom.removeAttribute("data-src");
        });
      headerNavContentRef.current.style = `height: ${
        height + 60
      }px; opacity: 1;`;
    } else {
      headerNavContentRef.current.style = `height: 0; opacity: 0;`;
    }
  }, [hoverActiveKey, navItemActive]);

  return (
    <>
      {/* 顶部广告位 */}
      <AnnouncementBar />
      {/* 网页导航栏 */}
      <nav className={styles.nav}>
        <div className={styles.header + ` ${navActive ? styles.active : ""}`}>
          <div className={styles.header_left}>
            {/* 更多ICON */}
            <div
              className={
                styles.header_mobile +
                ` ${navActive ? styles.header_mobile_active : ""}`
              }
              onClick={() => {
                setNavActive((value) => !value);
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
              className={
                styles.header_nav +
                ` ${navActive ? styles.header_mobile_height : ""}`
              }
            >
              <ul
                className={styles.header_nav_list}
                onMouseLeave={() => setVavItemActive(false)}
              >
                {navList.map((item) => {
                  return (
                    <li key={item.key}>
                      <Link
                        href={item.href}
                        onMouseOver={() => {
                          setVavItemActive(true);
                          setHoverActiveKey(item.key);
                        }}
                        onClick={(e) => {
                          if (window.innerWidth <= 1080) {
                            e.preventDefault();
                          }
                        }}
                        className={
                          (navItemActive || navActive) &&
                          hoverActiveKey === item.key
                            ? styles.nav_item_active
                            : ""
                        }
                      >
                        {item.title}
                      </Link>
                    </li>
                  );
                })}
              </ul>
              <div
                ref={headerNavContentRef}
                onMouseLeave={() => {
                  setVavItemActive(false);
                }}
                onMouseOver={() => {
                  setVavItemActive(true);
                }}
                className={styles.header_nav_content}
              >
                {/* nav_content */}
                <div
                  data-list-text={hoverActiveKey === "blog"}
                  ref={headerNavWidthRef}
                  className={styles.header_nav_width}
                >
                  {navList.map((item) => {
                    return item.list.map((navSubItem, navSubIndex) => {
                      return (
                        // 性能优化
                        <div
                          key={navSubIndex}
                          style={{
                            display:
                              item.key !== hoverActiveKey ? "none" : "block",
                          }}
                        >
                          {item.key === "blog" ? (
                            <NavSubTextItem
                              lastItem={navSubIndex === item.list.length - 1}
                              href={item.href}
                              navSubIndex={navSubIndex}
                              navSubItem={navSubItem}
                              setVavItemActive={setVavItemActive}
                              setNavActive={setNavActive}
                            />
                          ) : null}
                          {item.key !== "blog" ? (
                            <NavSubCommonItem
                              href={item.href}
                              navSubIndex={navSubIndex}
                              navSubItem={navSubItem}
                              setVavItemActive={setVavItemActive}
                              setNavActive={setNavActive}
                              showModal={() => ModalRef.current.showModal()}
                            />
                          ) : null}
                        </div>
                      );
                    });
                  })}
                </div>
              </div>
            </div>
          </div>
          {/* 左边区域 */}
          <RightArea setNavActive={setNavActive} navActive={navActive} />
        </div>
      </nav>
      <TipModal LANG={LANG} ref={ModalRef} />
    </>
  );
}

// 导航子列表 - Next
function NavSubNextItem({ setVavItemActive, setNavActive, href, type }) {
  const { LANG } = React.useContext(GlobalContext);
  return (
    <Link
      scroll={true}
      onClick={() => {
        setVavItemActive(false);
        setNavActive(false);
      }}
      href={href}
      className={
        type === "img"
          ? styles.header_nav_items_img
          : styles.header_nav_items_text_button
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
  setVavItemActive,
  setNavActive,
}) {
  if (navSubIndex > 8) return null;
  return (
    <>
      <Link
        scroll={true}
        onClick={() => {
          setVavItemActive(false);
          setNavActive(false);
        }}
        href={navSubItem.href}
        className={styles.header_nav_items_text}
      >
        {navSubItem.sub_title}
      </Link>
      {lastItem || navSubIndex === 8 ? (
        <NavSubNextItem
          type="text"
          href={href}
          setVavItemActive={setVavItemActive}
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
  setVavItemActive,
  setNavActive,
  showModal,
}) {
  if (navSubIndex > 15) return null;
  if (navSubIndex === 15)
    return (
      <NavSubNextItem
        type="img"
        href={href}
        setVavItemActive={setVavItemActive}
        setNavActive={setNavActive}
      />
    );
  return (
    <Link
      scroll={true}
      onClick={(e) => {
        setVavItemActive(false);
        setNavActive(false);
        if (!navSubItem.href) {
          showModal();
          e.preventDefault();
        }
      }}
      href={navSubItem.href}
      className={styles.header_nav_items_img}
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

function RightArea({ navActive, setNavActive }) {
  const router = useRouter();
  const { LANG, userInfo, productNum, area, showCartModal, showAreaModal } =
    React.useContext(GlobalContext);
  return (
    <ul className={styles.header_right}>
      {/* 用户ICON */}
      <li className={styles.header_user}>
        <DropSelect
          options={
            userInfo
              ? [
                  {
                    label: LANG["common.nav.my_account"],
                    value: "account",
                  },
                  {
                    label: LANG["common.nav.sign_out"],
                    value: "loginOut",
                  },
                ]
              : [
                  {
                    label: LANG["common.nav.log_in"],
                    value: "login",
                  },
                  {
                    label: LANG["common.nav.register"],
                    value: "register",
                  },
                ]
          }
          tanslatefromX={-4}
          position="bottom"
          selectValue={async (e) => {
            tracking.clickNavUser();
            if (e === "loginOut") {
              Api.loginOut();
              location.reload();
            } else {
              router.push(`/user/${e}`);
            }
          }}
        >
          <img
            alt="avatar"
            width={24}
            height={24}
            src={`${process.env.NEXT_PUBLIC_FILE}/image/icon/min-user.svg`}
          />
        </DropSelect>
      </li>
      {/* 购物车ICON */}
      <li
        className={styles.header_cart}
        onClick={() => {
          tracking.clickNavCart();
          showCartModal();
        }}
      >
        <div>
          {productNum !== 0 ? (
            <div className={styles.num}>{productNum}</div>
          ) : null}
          <img
            alt="avatar"
            src={`${process.env.NEXT_PUBLIC_FILE}/image/icon/min-cart.svg`}
          />
        </div>
      </li>
      {/* 国家ICON */}
      <li
        className={styles.header_country}
        onClick={() => {
          showAreaModal();
          tracking.clickNavArea();
        }}
      >
        <img
          alt={area}
          src={`${process.env.NEXT_PUBLIC_FILE}/image/icon/flags/${area}.svg`}
        />
      </li>
    </ul>
  );
}

// 顶部广告位
function AnnouncementBar() {
  const { CONFIG } = React.useContext(GlobalContext);
  const textListRef = React.useRef(null);
  const [activeIndex, setActiveIndex] = React.useState(0);
  const bannerList = React.useMemo(() => {
    return CONFIG["page.common.top_bar"];
  }, []);

  React.useEffect(() => {
    const $textListDom = textListRef.current;
    if (activeIndex === bannerList.length && $textListDom) {
      setTimeout(() => {
        const $activeTextDom = $textListDom.querySelector(
          "[data-active='true']"
        );
        const $firstTextDom = $textListDom.querySelector(
          "[data-active='false']"
        );
        $textListDom.style.transition = "none";
        $activeTextDom.style.transition = "none";
        $firstTextDom.style.transition = "none";
        setActiveIndex(0);
        setTimeout(() => {
          $textListDom.style.transition = "all 0.3s ease-in-out";
          $activeTextDom.style.transition = "all 0.3s ease-in-out";
          $firstTextDom.style.transition = "all 0.3s ease-in-out";
        }, 50);
      }, 300);
    }
  }, [activeIndex]);

  React.useEffect(() => {
    if (!bannerList || bannerList.length < 2) return;
    const timer = setInterval(() => {
      setActiveIndex((state) => state + 1);
    }, 5000);
    return () => clearInterval(timer);
  }, [bannerList]);

  if (!bannerList || bannerList?.length < 1) return null;
  return (
    <div className={styles.announcement_bar}>
      <div className={styles.top_header_container}>
        <div className={styles.text_banner}>
          <div
            ref={textListRef}
            className={styles.text_list}
            style={{
              transform: `translateY(-${activeIndex * 42}px)`,
            }}
          >
            {[...bannerList, bannerList[0]].map((item, index) => {
              return (
                <div key={index} className={styles.text_container}>
                  <div
                    className={styles.text}
                    data-active={index === activeIndex}
                    dangerouslySetInnerHTML={{
                      __html: item.content,
                    }}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
