"use client";

import React from "react";
import { useAtom, useAtomValue } from "jotai";
import styles from "./index.module.scss";
import { useCreateWizard } from "../../context";
import {
  purchaseTimeAtom,
  purchaseChannelAtom,
  purchaseOrderNoAtom,
  selectedProductAtom,
} from "../../atoms";

// 产品方式下方补充信息：购买日期 / 渠道 / 订单号（可选）。
// 仅在选中产品后展开，避免用户还没选产品就先看到表单。
export default function PurchaseForm() {
  const { T, LANG } = useCreateWizard();
  const selectedProduct = useAtomValue(selectedProductAtom);
  const [purchaseTime, setPurchaseTime] = useAtom(purchaseTimeAtom);
  const [purchaseChannel, setPurchaseChannel] = useAtom(purchaseChannelAtom);
  const [purchaseOrderNo, setPurchaseOrderNo] = useAtom(purchaseOrderNoAtom);

  if (!selectedProduct) return null;

  return (
    <div className={styles.purchase_form}>
      <label className={styles.field}>
        <span className={styles.field_label}>
          {T(
            LANG,
            "user_account.after_sale.purchase_time",
            "Purchase date"
          )}
          <i>*</i>
        </span>
        <input
          type="date"
          value={purchaseTime}
          onChange={(e) => setPurchaseTime(e.target.value)}
        />
      </label>
      <label className={styles.field}>
        <span className={styles.field_label}>
          {T(
            LANG,
            "user_account.after_sale.purchase_channel",
            "Purchase channel"
          )}
          <i>*</i>
        </span>
        <input
          type="text"
          value={purchaseChannel}
          onChange={(e) => setPurchaseChannel(e.target.value)}
          placeholder={T(
            LANG,
            "user_account.after_sale.purchase_channel_ph",
            "e.g. Official website, Amazon"
          )}
        />
      </label>
      <label className={styles.field}>
        <span className={styles.field_label}>
          {T(
            LANG,
            "user_account.after_sale.purchase_order_no",
            "Purchase order number"
          )}
        </span>
        <input
          type="text"
          value={purchaseOrderNo}
          onChange={(e) => setPurchaseOrderNo(e.target.value)}
          placeholder={T(
            LANG,
            "user_account.after_sale.optional",
            "Optional"
          )}
        />
      </label>
    </div>
  );
}
