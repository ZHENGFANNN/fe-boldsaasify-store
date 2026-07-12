"use client";

import React from "react";
import Api from "../../../../api";
import styles from "../index.module.scss";

// 常见快递公司列表（LANG 有 override 时展开值使用后端 key）。前端不硬绑运营方，后端只做长度校验。
const DEFAULT_COURIERS = [
  "SF Express",
  "UPS",
  "FedEx",
  "DHL",
  "USPS",
  "圆通",
  "顺丰",
  "EMS",
  "Yamato",
];

// 客户回寄快递表单：仅 status 非终态 && shipped_at 未落库时可写。
// 提交后自动置 shipped_at；父组件 onSubmitted 触发详情刷新。
const ShipmentForm = React.memo(function ShipmentForm({
  data,
  editable,
  LANG,
  T,
  onSubmitted,
  toast,
}) {
  const initialCompany = data.express_company || "";
  const initialNo = data.express_no || "";
  const [company, setCompany] = React.useState(initialCompany);
  const [expressNo, setExpressNo] = React.useState(initialNo);
  const [pending, setPending] = React.useState(false);

  const submit = React.useCallback(async () => {
    if (pending) return;
    if (!company.trim() || !expressNo.trim()) {
      toast?.(
        T(
          LANG,
          "user_account.after_sale.express_required",
          "Please provide both courier and tracking number."
        ),
        false
      );
      return;
    }
    setPending(true);
    try {
      const res = await Api.updateAfterServiceExpress({
        service_no: data.service_no,
        express_company: company.trim(),
        express_no: expressNo.trim(),
      });
      if (res.code !== 0) throw new Error("code!==0");
      toast?.(
        T(
          LANG,
          "user_account.after_sale.express_updated",
          "Shipping info saved."
        ),
        true
      );
      onSubmitted?.();
    } catch (_) {
      toast?.(
        T(
          LANG,
          "user_account.after_sale.express_update_failed",
          "Failed to save. Please try again."
        ),
        false
      );
    } finally {
      setPending(false);
    }
  }, [company, expressNo, pending, data.service_no, toast, T, LANG, onSubmitted]);

  return (
    <div className={styles.shipment_card}>
      <div className={styles.section_title}>
        {T(LANG, "user_account.after_sale.shipment_title", "Logistics")}
      </div>
      <p className={styles.shipment_hint}>
        {T(
          LANG,
          "user_account.after_sale.shipment_desc_1",
          "Please ship the product within 15 days, otherwise your request will expire."
        )}
      </p>
      <p className={styles.shipment_hint}>
        {T(
          LANG,
          "user_account.after_sale.shipment_desc_2",
          "Shipping instructions have been sent to the contact info above."
        )}
      </p>

      <div className={styles.shipment_form_label}>
        {T(LANG, "user_account.after_sale.shipment_label", "Courier info")}
        <span className={styles.shipment_required}>*</span>
      </div>
      <div className={styles.shipment_form_row}>
        <select
          className={styles.shipment_select}
          value={company}
          onChange={(e) => setCompany(e.target.value)}
          disabled={!editable || pending}
        >
          <option value="">
            {T(
              LANG,
              "user_account.after_sale.courier_placeholder",
              "Select courier"
            )}
          </option>
          {DEFAULT_COURIERS.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
          {initialCompany && !DEFAULT_COURIERS.includes(initialCompany) ? (
            <option value={initialCompany}>{initialCompany}</option>
          ) : null}
        </select>
        <input
          type="text"
          className={styles.shipment_input}
          value={expressNo}
          onChange={(e) => setExpressNo(e.target.value)}
          placeholder={T(
            LANG,
            "user_account.after_sale.tracking_placeholder",
            "Tracking number"
          )}
          disabled={!editable || pending}
        />
      </div>

      {editable ? (
        <button
          type="button"
          className={styles.shipment_submit}
          onClick={submit}
          disabled={pending}
        >
          <span>
            {data.express_no
              ? T(LANG, "user_account.after_sale.update_shipping", "Update")
              : T(LANG, "user_account.after_sale.submit_shipping", "Submit")}
          </span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path
              d="M7 17L17 7M17 7H8M17 7v9"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      ) : null}
    </div>
  );
});

export default ShipmentForm;
