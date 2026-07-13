"use client";

import React from "react";
import { useRouter } from "next/navigation";
import ResultState from "@/components/ResultState";
import { defaultLocale } from "@/config/languageSettings";

// 文案兜底：语言包暂未配置 user_account.after_sale.* 时用英文兜底
const T = (LANG, key, fallback) => LANG?.[key] || fallback;

// 默认语言不带前缀，其它语言带 /{locale}（与 middleware buildLocalizedPath 约定一致）
const localeHref = (path, locale) =>
  locale && locale !== defaultLocale ? `/${locale}${path}` : path;

/**
 * 售后提单成功态：替代向导表单展示，引导查看工单详情或返回列表。
 * 视觉与交互统一由 @/components/ResultState 承载。
 */
export default function SubmitSuccess({ LANG, locale, serviceNo }) {
  const router = useRouter();

  const actions = [];
  if (serviceNo) {
    actions.push({
      key: "view",
      label: T(LANG, "user_account.after_sale.view_ticket", "View ticket"),
      variant: "primary",
      onClick: () =>
        router.push(
          localeHref(`/support/after-sales/detail?no=${serviceNo}`, locale)
        ),
    });
  }
  actions.push({
    key: "back",
    label: T(LANG, "user_account.after_sale.back_to_list", "Back to list"),
    variant: "ghost",
    onClick: () =>
      router.push(localeHref("/support/after-sales/progress", locale)),
  });

  return (
    <ResultState
      status="success"
      title={T(
        LANG,
        "user_account.after_sale.submit_success_title",
        "Submitted successfully"
      )}
      description={T(
        LANG,
        "user_account.after_sale.submit_success_desc",
        "Our customer service team will handle your request as soon as possible."
      )}
      actions={actions}
    />
  );
}
