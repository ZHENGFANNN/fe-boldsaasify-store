"use client";

import React from "react";
import { useRouter } from "next/navigation";
import styles from "./index.module.scss";
import { defaultLocale } from "@/config/languageSettings";

// 文案兜底：语言包暂未配置 user_account.after_sale.* 时用英文兜底
const T = (LANG, key, fallback) => LANG?.[key] || fallback;

// 默认语言不带前缀，其它语言带 /{locale}（与 middleware buildLocalizedPath 约定一致）
const localeHref = (path, locale) =>
  locale && locale !== defaultLocale ? `/${locale}${path}` : path;

/**
 * 售后提单成功态：替代向导表单展示，引导查看工单详情或返回列表。
 */
export default function SubmitSuccess({ LANG, locale, serviceNo }) {
  const router = useRouter();

  const viewTicket = () => {
    router.push(
      localeHref(`/support/after-sales/detail?no=${serviceNo}`, locale)
    );
  };

  const backToList = () => {
    router.push(localeHref("/support/after-sales/progress", locale));
  };

  return (
    <div className={styles.success} data-role="after-sale-submit-success">
      <div className={styles.icon}>
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="1.6"
          />
          <path
            d="M8 12.4l2.6 2.6L16 9.5"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      <h1 className={styles.title}>
        {T(
          LANG,
          "user_account.after_sale.submit_success_title",
          "Submitted successfully"
        )}
      </h1>

      <p className={styles.desc}>
        {T(
          LANG,
          "user_account.after_sale.submit_success_desc",
          "Our customer service team will handle your request as soon as possible."
        )}
      </p>

      <div className={styles.actions}>
        {serviceNo ? (
          <button
            type="button"
            className={styles.btn_primary}
            onClick={viewTicket}
          >
            {T(LANG, "user_account.after_sale.view_ticket", "View ticket")}
          </button>
        ) : null}
        <button
          type="button"
          className={styles.btn_ghost}
          onClick={backToList}
        >
          {T(LANG, "user_account.after_sale.back_to_list", "Back to list")}
        </button>
      </div>
    </div>
  );
}
