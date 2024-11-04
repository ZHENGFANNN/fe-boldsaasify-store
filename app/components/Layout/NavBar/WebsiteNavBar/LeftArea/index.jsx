import React from "react";
import GlobalContext from "@/[locale]/context";

import NAVFUNC from "@/config/NAVFUNC";
import TipModal from "@/components/Modal/FunctionTipModal";
import Link from "next/link";

import { trackingCustomClick } from "@/utils";

import styles from "./index.module.scss";

export default function LeftArea({ navActive, setNavActive }) {
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
        className={
          styles.header_nav + ` ${navActive ? styles.header_mobile_height : ""}`
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
                    (navItemActive || navActive) && hoverActiveKey === item.key
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
                      display: item.key !== hoverActiveKey ? "none" : "block",
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
      <TipModal LANG={LANG} ref={ModalRef} />
    </div>
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
