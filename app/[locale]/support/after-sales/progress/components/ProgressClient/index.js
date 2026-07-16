"use client";

import React from "react";
import styles from "../../page.module.scss";
import AfterSaleInfo from "@/[locale]/user/account/components/AfterSaleInfo";
import SegmentTabs from "@/components/SegmentTabs";

// 文案兜底：语言包暂未配置 user_account.after_sale.* 时用英文兜底；
// 语言维度兜底走 zh/en 分流。
const T = (LANG, key, fallback) => LANG?.[key] || fallback;
const TL = (LANG, key, zh, en, locale) =>
  LANG?.[key] || (locale?.startsWith("zh") ? zh : en);

// 状态映射：进行中 = pending + processing，历史 = resolved + rejected + closed
const FILTER_TABS = [
  { key: "all", zh: "全部工单", en: "All tickets" },
  { key: "active", zh: "进行中", en: "In progress" },
  { key: "history", zh: "历史工单", en: "History" },
];

// 登录守卫已上移到全局 <AuthBoundary>（受保护路由 /support/after-sales 统一接管），
// 本组件挂载即代表已登录，无需再自检 cookie / 渲染 AuthRedirectGuard。
export default function ProgressClient({ LANG, locale }) {
  const [filter, setFilter] = React.useState("all");

  const filterOptions = React.useMemo(
    () =>
      FILTER_TABS.map((tab) => ({
        value: tab.key,
        label: TL(
          LANG,
          `user_account.after_sale.filter.${tab.key}`,
          tab.zh,
          tab.en,
          locale
        ),
      })),
    [LANG, locale]
  );

  return (
    <div className={styles.container}>
      <div className={styles.wizard}>
        <h1 className="header">
          {T(
            LANG,
            "user_account.after_sale.progress_page_title",
            locale?.startsWith("zh")
              ? "跟踪售后服务"
              : "Track After-Sales Service"
          )}
        </h1>

        <div className={styles.tabs_wrap}>
          <SegmentTabs
            options={filterOptions}
            value={filter}
            onChange={setFilter}
          />
        </div>

        <div className={styles.card}>
          <AfterSaleInfo LANG={LANG} filter={filter} />
        </div>
      </div>
    </div>
  );
}
