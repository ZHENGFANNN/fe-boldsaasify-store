"use client";

import React from "react";
import { copyToClipboard } from "@/utils";
import styles from "../index.module.scss";

// 服务信息卡片：服务单号（含复制）+ 创建日期 + 邮箱/手机号只读展示。
// props:
//   data     : 售后详情
//   LANG, T  : 语言包 & 兜底文案函数
//   toast    : (msg, ok) => void  toast 出错/成功提示
const ServiceInfoCard = React.memo(function ServiceInfoCard({
  data,
  LANG,
  T,
  toast,
}) {
  const [copied, setCopied] = React.useState(false);

  const copyServiceNo = React.useCallback(async () => {
    const no = data.service_no || "";
    if (!no) return;
    const ok = await copyToClipboard(no);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
      toast?.(
        T(LANG, "user_account.after_sale.copy_success", "Copied to clipboard"),
        true
      );
    } else {
      toast?.(
        T(
          LANG,
          "user_account.after_sale.copy_failed",
          "Copy failed, please try again"
        ),
        false
      );
    }
  }, [data.service_no, toast, T, LANG]);

  const createdDate = React.useMemo(() => {
    const s = data.created_time || "";
    // "2026-07-12T13:33:00Z" 或 "2026-07-12 13:33:00"，简化只显示日期
    return s.length >= 10 ? s.slice(0, 10) : s;
  }, [data.created_time]);

  return (
    <div className={styles.info_card}>
      <div className={styles.section_title}>
        {T(LANG, "user_account.after_sale.info_title", "Service Info")}
      </div>

      {/* 服务单号 + 复制 */}
      <div className={styles.info_row_lg}>
        <span className={styles.info_label}>
          {T(LANG, "user_account.after_sale.service_no", "Service No.")}
        </span>
        <span className={styles.info_value_mono}>{data.service_no}</span>
        <button
          type="button"
          className={styles.link_btn}
          onClick={copyServiceNo}
        >
          {copied
            ? T(LANG, "user_account.after_sale.copied", "Copied")
            : T(LANG, "user_account.after_sale.copy", "Copy")}
        </button>
      </div>

      <div className={styles.info_row_lg}>
        <span className={styles.info_label}>
          {T(LANG, "user_account.after_sale.created_date", "Created")}
        </span>
        <span className={styles.info_value}>{createdDate}</span>
      </div>

      {/* 邮箱（只读） */}
      {data.contact_email !== undefined ? (
        <div className={styles.info_row_lg}>
          <span className={styles.info_label}>
            {T(LANG, "user_account.after_sale.contact.email", "Email")}
          </span>
          <span className={styles.info_value}>
            {data.contact_email || "-"}
          </span>
        </div>
      ) : null}

      {/* 手机号（只读） */}
      {data.contact_phone !== undefined ? (
        <div className={styles.info_row_lg}>
          <span className={styles.info_label}>
            {T(LANG, "user_account.after_sale.contact.phone", "Phone")}
          </span>
          <span className={styles.info_value}>
            {data.contact_phone || "-"}
          </span>
        </div>
      ) : null}
    </div>
  );
});

export default ServiceInfoCard;
