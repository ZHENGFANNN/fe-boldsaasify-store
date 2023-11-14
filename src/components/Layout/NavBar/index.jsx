"use client";
import styles from "./index.module.scss";

import CountryList from "@/components/CountrySelect";

import React from "react";
import DropSelect from "@/components/DropSelect";
import Link from "next/link";
import Router, { useRouter } from "next/navigation";

import NAVFUNC from "@/config/NAVFUNC";

import TipModal from "@/components/Modal/FunctionTipModal";
import Api from "../api";
import GlobalContext from "@/context";

export default function NavBar({ CONFIG, LANG, GOODSORTLIST, GOODLIST }) {
  const { userInfo, productNum, locale = "en" } = {};
  const ModalRef = React.useRef(null);
  const NAVLIST = React.useMemo(() => {
    return NAVFUNC({ LANG, CONFIG, GOODLIST, GOODSORTLIST });
  }, [LANG, CONFIG, GOODLIST, GOODSORTLIST]);

  const router = useRouter();

  // 展示移动端购物车
  const showFixedCart = React.useMemo(() => {
    return ![
      "/store/cart",
      "/store/order",
      "/store/order/info",
      "/store/product/",
    ].some((item) => {
      return router.pathname?.includes(item);
    });
  }, []);

  // 逻辑处理
  // 展开导航栏屏幕（小于1080）
  const [navActive, setNavActive] = React.useState(false);
  React.useEffect(() => {
    if (document.body.clientWidth > 1080) return;
    if (navActive) {
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
    function scrollEvent() {
      // 处理下拉样式
      if (navItemActive) setVavItemActive(false);
      // 处理top header
      if (document.documentElement.scrollTop > 40) {
        document.getElementsByClassName(`${styles.container}`)[0].style.top =
          "-40px";
      } else {
        document.getElementsByClassName(`${styles.container}`)[0].style.top =
          "0";
      }
    }
    window.addEventListener("scroll", scrollEvent);
    return () => {
      window.removeEventListener("scroll", scrollEvent);
    };
  }, [navItemActive]);

  return (
    <>
      <nav id="app-nav" className={styles.container}>
        <div className={styles.top_header}>
          <div className={styles.top_header_container}>
            <CountryList LANG={LANG} />
            <div
              className={styles.header_user}
              onClick={() => {
                if (userInfo) {
                  location.href = `/user/account`;
                } else {
                  location.href = `/user/login`;
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
                src={`${process.env.NEXT_PUBLIC_IMAGE}/icon/min-user.svg`}
              />
            </div>
          </div>
        </div>
        <div className={styles.header}>
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
              <a
                href={`/${locale}`}
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
              </a>
            </div>
            <div
              className={
                styles.header_nav +
                ` ${navActive ? styles.header_mobile_height : ""}`
              }
            >
              <ul onMouseLeave={() => setVavItemActive(false)}>
                {NAVLIST.map((item, index) => {
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
              <section
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
                  {NAVLIST.map((item, index) => {
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
                              fill
                              src={`${process.env.NEXT_PUBLIC_IMAGE}/icon/nav-learn-more.svg`}
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
                            <a
                              className={styles.header_nav_items}
                              onClick={() => {
                                setVavItemActive(false);
                                setNavActive(false);
                                if (!item2.href) {
                                  ModalRef.current.showModal();
                                } else {
                                  location.href = item2.href;
                                }
                              }}
                            >
                              {item2.img}
                              <p>{item2.sub_title}</p>
                            </a>
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
              </section>
            </div>
          </div>
          <ul className={styles.header_right}>
            <li>
              <a
                className={styles.header_store_container}
                href={`/${locale}/store`}
              >
                <img
                  src={`${process.env.NEXT_PUBLIC_IMAGE}/icon/min-store.svg`}
                  alt="store"
                />
                <div className={styles.header_store_title}>
                  {LANG["common.nav.store"]}
                </div>
              </a>
            </li>
            <li
              className={styles.header_cart}
              onClick={() => {
                window.location.href = `/${locale}/store/cart`;
              }}
            >
              {productNum !== 0 ? (
                <div className={styles.num}>{productNum}</div>
              ) : null}
              <img
                alt="avatar"
                width={24}
                height={24}
                src={`${process.env.NEXT_PUBLIC_IMAGE}/icon/min-cart.svg`}
              />
            </li>
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
                    location.href = `/${locale}/user/${e}`;
                  }
                }}
              >
                <img
                  alt="avatar"
                  width={24}
                  height={24}
                  src={`${process.env.NEXT_PUBLIC_IMAGE}/icon/min-user.svg`}
                />
              </DropSelect>
            </li>
          </ul>
        </div>
      </nav>
      <TipModal LANG={LANG} ref={ModalRef} />
      {showFixedCart ? (
        <div
          onClick={() => {
            location.href = "/store/cart";
          }}
          className={`${styles.fixed_cart}`}
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
              <filter id="headerMinCartIcon">
                <feFlood
                  floodColor="rgba(255, 255, 255)"
                  floodOpacity="1"
                  result="color"
                />
                <feComposite in="color" in2="SourceGraphic" operator="in" />
              </filter>
            </defs>
          </svg>
          <img
            style={{
              filter: "url('#headerMinCartIcon')",
            }}
            alt="cart"
            width={20}
            height={20}
            src={`${process.env.NEXT_PUBLIC_IMAGE}/icon/min-cart.svg`}
          />
          {/* {productNum !== 0 ? <div className={styles.num}>{productNum}</div> : null} */}
        </div>
      ) : null}
    </>
  );
}
