"use client";

import React from "react";
import { usePathname } from "next/navigation";
import Cookie from "js-cookie";

import GlobalContext from "@/[locale]/context";
import { languageList, defaultLocale } from "@/config/languageSettings";

import styles from "./index.module.scss";

/**
 * 语言母语名映射：用各语言自身的写法展示，确保任何语种用户都能认出自己的语言。
 * 找不到时回退到 languageSettings 的 label（后台 endonym_name/name）。
 */
const endonymMap = {
  en: "English",
  "zh-cn": "简体中文",
  "zh-tw": "繁體中文",
  ja: "日本語",
  ko: "한국어",
  fr: "Français",
  de: "Deutsch",
  es: "Español",
  it: "Italiano",
  pt: "Português",
  ru: "Русский",
  ar: "العربية",
};

/** 小标题多语言（语言区块本身的标题，不依赖语言库 key 是否已补） */
const sectionTitleMap = {
  en: "Language",
  "zh-cn": "语言",
  ja: "言語",
};

function getEndonym(item) {
  return endonymMap[item.value] || item.label || item.value;
}

/**
 * 复刻 middleware.buildLocalizedPath：
 * 去掉当前 locale 前缀得到语言无关路径，再按目标语言加前缀（默认语言不加）。
 */
function buildLocalizedPath(pathname, fromLocale, toLocale) {
  let path = pathname || "/";

  if (fromLocale && fromLocale !== defaultLocale) {
    path = path.replace(new RegExp(`^/${fromLocale}(?=/|$)`), "") || "/";
  } else {
    path = path.replace(new RegExp(`^/${defaultLocale}(?=/|$)`), "") || "/";
  }

  if (toLocale === defaultLocale) return path;
  return `/${toLocale}${path === "/" ? "" : path}`;
}

export default function LanguagePicker({ onAfterSelect }) {
  const { locale } = React.useContext(GlobalContext);
  const pathname = usePathname();
  const [lock, setLock] = React.useState(false);

  const currentLocale = locale || defaultLocale;
  const list = languageList && languageList.length ? languageList : [];

  if (list.length <= 1) return null;

  const handleSelect = (target) => {
    if (lock || target.value === currentLocale) return;
    setLock(true);

    const expires = new Date(Date.now() + 720 * 24 * 60 * 60 * 1000);
    Cookie.set("locale", target.value, { path: "/", expires });

    const nextPath = buildLocalizedPath(pathname, currentLocale, target.value);

    if (typeof onAfterSelect === "function") onAfterSelect();
    // 硬导航：对齐站内既有切语言写法（order/Main location.href、地区选择 location.reload）。
    // 语言文案在 server layout 按 locale 异步拉取，软导航(router.push)命中 Router Cache
    // 不会重跑 layout → LANG 不刷新 → 页面语言不变。故必须整页重载。
    window.location.href = nextPath || "/";
  };

  return (
    <div className={styles.language_block}>
      <div className={styles.section_title}>
        {sectionTitleMap[currentLocale] || sectionTitleMap.en}
      </div>
      <div className={styles.pills}>
        {list.map((item) => {
          const active = item.value === currentLocale;
          return (
            <button
              type="button"
              key={item.value}
              className={`${styles.pill} ${active ? styles.pill_active : ""}`}
              aria-pressed={active}
              disabled={lock}
              onClick={() => handleSelect(item)}
            >
              {active ? (
                <svg
                  className={styles.check}
                  viewBox="0 0 16 16"
                  width="14"
                  height="14"
                  aria-hidden="true"
                >
                  <path
                    d="M3.5 8.5l3 3 6-6.5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              ) : null}
              {getEndonym(item)}
            </button>
          );
        })}
      </div>
    </div>
  );
}
