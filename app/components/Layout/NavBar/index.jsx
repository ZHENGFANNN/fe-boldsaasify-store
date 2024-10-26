/** @format */

"use client";
import React from "react";
import GlobalContext from "@/[locale]/context";

import NAVFUNC from "../../../config/NAVFUNC";
import TipModal from "../../Modal/FunctionTipModal";
import CountryList from "../../CountrySelect";
import DropSelect from "../../DropSelect";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";

import Api from "../api";
import tracking from "../tracking";

import styles from "./index.module.scss";

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
      {/* 顶部选择区域 */}
      <TopNavBar />
      <nav className={styles.nav}>
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
                scroll={true}
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
          <RightArea />
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

function TopNavBar() {
  const { userInfo } = React.useContext(GlobalContext);
  const router = useRouter();
  return (
    <div className={styles.announcement_bar}>
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
        <Link
          scroll={true}
          className={styles.header_store_container}
          href={`/`}
        >
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
