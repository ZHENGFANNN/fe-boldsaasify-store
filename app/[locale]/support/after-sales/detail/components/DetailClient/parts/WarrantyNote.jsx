"use client";

import React from "react";
import styles from "../index.module.scss";

// 保修说明卡（浅蓝色背景）：静态说明文字，参考图右下角部分。
// 全部文案走 LANG 兜底 + 英文默认；无用户输入变量，纯 static。
const WarrantyNote = React.memo(function WarrantyNote({ LANG, T }) {
  const items = [
    {
      key: "free_repair",
      label: T(
        LANG,
        "user_account.after_sale.warranty.free_repair_label",
        "Free repair"
      ),
      body: T(
        LANG,
        "user_account.after_sale.warranty.free_repair_body",
        "The repaired parts inherit the original warranty period or reset to 90 days, whichever is longer."
      ),
    },
    {
      key: "paid_repair",
      label: T(
        LANG,
        "user_account.after_sale.warranty.paid_repair_label",
        "Paid repair"
      ),
      body: T(
        LANG,
        "user_account.after_sale.warranty.paid_repair_body",
        "The warranty on repaired parts is restarted."
      ),
    },
    {
      key: "optional_repair",
      label: T(
        LANG,
        "user_account.after_sale.warranty.optional_repair_label",
        "Optional / water damage repair"
      ),
      body: T(
        LANG,
        "user_account.after_sale.warranty.optional_repair_body",
        "The whole unit is out of warranty; free warranty service is not provided."
      ),
    },
    {
      key: "discount_replace",
      label: T(
        LANG,
        "user_account.after_sale.warranty.discount_replace_label",
        "Discount replacement"
      ),
      body: T(
        LANG,
        "user_account.after_sale.warranty.discount_replace_body",
        "The warranty period is restarted."
      ),
    },
  ];
  return (
    <div className={styles.warranty_card}>
      <div className={styles.warranty_title}>
        {T(
          LANG,
          "user_account.after_sale.warranty.title",
          "Warranty Notes"
        )}
      </div>
      <ul className={styles.warranty_list}>
        {items.map((it) => (
          <li key={it.key}>
            <b>{it.label}:</b> {it.body}
          </li>
        ))}
      </ul>
    </div>
  );
});

export default WarrantyNote;
