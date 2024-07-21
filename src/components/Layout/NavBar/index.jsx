/** @format */

"use client";
import React from "react";
import GlobalContext from "@/GlobalContext";

import NAVFUNC from "@/config/NAVFUNC";
import TipModal from "@/components/Modal/FunctionTipModal";
import CountryList from "@/components/CountrySelect";
import DropSelect from "@/components/DropSelect";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";

import Api from "../api";
import tracking from "../tracking";

import styles from "./index.module.scss";

export default function NavBar() {
  const pathname = usePathname();
  const { LANG, CONFIG, goodSortList, goodList } =
    React.useContext(GlobalContext);
  const ModalRef = React.useRef(null);

  const navList = React.useMemo(() => {
    return NAVFUNC({
      LANG,
      CONFIG,
      goodList,
      goodSortList,
    });
  }, [LANG, CONFIG, goodList, goodSortList]);

  const router = useRouter();

  // 逻辑处理
  // 展开导航栏屏幕（小于1080）
  const [navActive, setNavActive] = React.useState(false);
  React.useEffect(() => {
    if (document.body.clientWidth > 1080) return;
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
  const [hoverActiveKey, setHoverActiveKey] = React.useState(0);
  // 下拉选项
  const [navItemActive, setVavItemActive] = React.useState(false);
  // 下拉高度设置
  const headerNavWidthRef = React.useRef(null);
  const headerNavContentRef = React.useRef(null);
  React.useEffect(() => {
    if (document.body.clientWidth <= 1080) return;
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

  /**
   * 监听滚动条
   * 1、处理top header
   * 2、处理下拉样式
   */
  React.useEffect(() => {
    function scrollEvent({ firstInit }) {
      // 处理下拉样式
      if (navItemActive && !firstInit) {
        setVavItemActive(false);
      }
      // 处理top header
      // 不展示TOP header
      const hiddenTopHeader = ["/blog"].find((item) => pathname.includes(item));
      if (hiddenTopHeader) {
        document.getElementsByClassName(
          `${styles.container}`
        )[0].style.transform = "translateY(-40px)";
        return;
      }

      // 展示TOP header
      if (document.documentElement.scrollTop > 40) {
        document.getElementsByClassName(
          `${styles.container}`
        )[0].style.transform = "translateY(-40px)";
      } else {
        document.getElementsByClassName(
          `${styles.container}`
        )[0].style.transform = "translateY(0)";
        document.getElementById("app-content").style.marginTop =
          document.body.clientWidth <= 1080 ? "90px" : "100px";
      }
    }
    scrollEvent({ firstInit: true });
    window.addEventListener("scroll", scrollEvent);
    return () => {
      window.removeEventListener("scroll", scrollEvent);
    };
  }, [navItemActive, pathname]);

  return (
    <>
      <nav id="app-nav" className={styles.container}>
        {/* 顶部选择区域 */}
        <TopNavBar />
        <div className={styles.header + ` ${navActive ? styles.active : ""}`}>
          {/* 移动端ICON */}
          <div
            className={
              styles.header_mobile_btn +
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

          <div className={styles.header_left}>
            <div className={styles.header_logo}>
              <Link
                href={`/`}
                onClick={() => {
                  setNavActive(false);
                }}
              >
                <img
                  alt={"logo"}
                  width={30}
                  height={30}
                  src={CONFIG["company.basic.logo"]}
                />
              </Link>
            </div>
            <div
              className={
                styles.header_nav +
                ` ${navActive ? styles.header_mobile_height : ""}`
              }
            >
              <ul onMouseLeave={() => setVavItemActive(false)}>
                {navList.map((item, index) => {
                  return (
                    <li
                      onMouseOver={() => {
                        setVavItemActive(true);
                        setHoverActiveKey(index);
                      }}
                      onClick={() => {
                        if (window.innerWidth > 1080)
                          router.push(`/nav/${item.key}`);
                      }}
                      key={item.key}
                      className={
                        (navItemActive || navActive) && hoverActiveKey === index
                          ? styles.nav_item_active
                          : ""
                      }
                    >
                      {item.title}
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
                  ref={headerNavWidthRef}
                  className={styles.header_nav_width}
                >
                  {navList.map((item, index) => {
                    if (item.list?.length > 13) {
                      item.list.length = 14;
                    }
                    // 最多展示13个
                    return item.list.map((item2, index2) => {
                      if (index2 === 13) {
                        return (
                          <Link
                            style={{
                              display:
                                index !== hoverActiveKey ? "none" : "flex",
                            }}
                            href={`/nav/${item.key}`}
                            className={styles.header_nav_items}
                            key={index2}
                          >
                            <img
                              alt={LANG["common.nav.faq"]}
                              data-src={`${process.env.NEXT_PUBLIC_FILE}/image/icon/nav-learn-more.svg`}
                            />
                            <p>{LANG["common.nav.learn_more"]}</p>
                          </Link>
                        );
                      }
                      return (
                        // 性能优化
                        <div
                          key={index2}
                          style={{
                            display:
                              index !== hoverActiveKey ? "none" : "block",
                          }}
                        >
                          {item.key === "where_buy" ? (
                            <div
                              className={styles.header_nav_items}
                              onClick={() => {
                                setVavItemActive(false);
                                setNavActive(false);
                                if (!item2.href) {
                                  ModalRef.current.showModal();
                                } else {
                                  if (item2.href.startsWith("http")) {
                                    window.open(item2.href);
                                  } else {
                                    router.push(item2.href);
                                  }
                                }
                              }}
                            >
                              {item2.img}
                              <p>{item2.sub_title}</p>
                            </div>
                          ) : null}
                          {item.key ===
                          "where_buy" ? null : item2.href.startsWith("http") ? (
                            <a
                              className={styles.header_nav_items}
                              onClick={() => {
                                setVavItemActive(false);
                                setNavActive(false);
                              }}
                              href={item2.href}
                              rel="noreferrer"
                            >
                              {item2.img}
                              <p>{item2.sub_title}</p>
                            </a>
                          ) : (
                            <Link
                              onClick={() => {
                                setVavItemActive(false);
                                setNavActive(false);
                              }}
                              href={`${item2.href}`}
                              className={styles.header_nav_items}
                              key={index2}
                            >
                              {item2.img}
                              <p>{item2.sub_title}</p>
                            </Link>
                          )}
                        </div>
                      );
                    });
                  })}
                </div>
              </div>
            </div>
          </div>
          {/* 左边区域 */}
          <RightArea />
        </div>
      </nav>
      <TipModal LANG={LANG} ref={ModalRef} />
    </>
  );
}

function TopNavBar() {
  const { userInfo } = React.useContext(GlobalContext);
  const router = useRouter();
  return (
    <div className={styles.top_header}>
      <div className={styles.top_header_container}>
        <CountryList />
        <div
          className={styles.header_user}
          onClick={() => {
            if (userInfo) {
              router.push(`/user/account`);
            } else {
              router.push(`/user/login`);
            }
          }}
        >
          <svg
            style={{
              opacity: 0,
              position: "fixed",
              left: "-1000px",
              top: "-1000px",
            }}
          >
            <defs>
              <filter id="headerMinUserIcon">
                <feFlood
                  floodColor="rgba(0, 0, 0, 0.7)"
                  floodOpacity="1"
                  result="color"
                />
                <feComposite in="color" in2="SourceGraphic" operator="in" />
              </filter>
            </defs>
          </svg>
          <img
            style={{
              filter: "url('#headerMinUserIcon')",
            }}
            alt="avatar"
            width={18}
            height={18}
            src={`${process.env.NEXT_PUBLIC_FILE}/image/icon/min-user.svg`}
          />
        </div>
      </div>
    </div>
  );
}

function RightArea() {
  const router = useRouter();
  const { LANG, userInfo, productNum, showCartModal } =
    React.useContext(GlobalContext);
  return (
    <ul className={styles.header_right}>
      {/* 商店ICON */}
      <li
        onClick={() => {
          tracking.clickNavStoreBtn();
        }}
      >
        <Link className={styles.header_store_container} href={`/`}>
          <img
            src={`${process.env.NEXT_PUBLIC_FILE}/image/icon/min-store.svg`}
            alt="store"
          />
          <div className={styles.header_store_title}>
            {LANG["common.nav.store"]}
          </div>
        </Link>
      </li>
      {/* 购物车ICON */}
      <li
        className={styles.header_cart}
        onClick={() => {
          showCartModal();
        }}
      >
        <div>
          {productNum !== 0 ? (
            <div className={styles.num}>{productNum}</div>
          ) : null}
          <img
            alt="avatar"
            width={24}
            height={24}
            src={`${process.env.NEXT_PUBLIC_FILE}/image/icon/min-cart.svg`}
          />
        </div>
      </li>
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
          tanslatefromX={12}
          position="bottom"
          selectValue={async (e) => {
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
    </ul>
  );
}
