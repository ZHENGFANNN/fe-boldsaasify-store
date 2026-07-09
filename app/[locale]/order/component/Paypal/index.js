"use client";

import {
  PayPalScriptProvider,
  PayPalButtons,
  FUNDING,
  usePayPalScriptReducer
} from "@paypal/react-paypal-js";
import React from "react";
import Loading from "../../../../components/Loading";

import styles from "./index.module.scss";

function PayButton({
  createOrder,
  onApprove,
  onCancel,
  onError,
  LANG,
  CONFIG
}) {
  const [
    { isPending, isRejected, options },
    dispatch
  ] = usePayPalScriptReducer();

  if (isRejected) {
    return (
      <div className={styles.pay_error_container}>
        <div
          className={styles.btn_container}
          onClick={() => {
            dispatch({
              type: "resetOptions",
              value: options
            });
          }}
        >
          <div className={styles.title}>
            {LANG["common.pay.pay_button.pay_fail_title"]}
          </div>
          <div className={styles.button}>
            {LANG["common.pay.pay_button.pay_fail_click_reload"]}
          </div>
        </div>
        <div className={styles.tip}>
          {LANG["common.pay.pay_button.pay_fail_error_tip"]?.replace(
            "${email}",
            CONFIG["common.base"]?.customer_service
          )}
        </div>
      </div>
    );
  }

  if (isPending) {
    return <Loading height={108} />;
  }

  return (
    <PayPalButtons
      fundingSource={FUNDING.PAYPAL}
      style={{
        layout: "vertical",
        color: "gold",
        shape: "pill",
        label: "paypal",
        "disable-country-change": "true"
      }}
      createOrder={createOrder}
      onApprove={onApprove}
      onCancel={onCancel}
      onError={onError}
    />
  );
}

export default function Paypal({
  currency,
  area,
  locale,
  onApprove,
  createOrder,
  onCancel,
  onError,
  LANG,
  CONFIG
}) {
  const countryCode = React.useMemo(() => {
    let countryCode = area;
    if (area === "hk_en") {
      countryCode = "HK";
    } else if (area === "ca_en") {
      countryCode = "CA";
    } else if (area === "c2") {
      return "CN";
    } else {
      return countryCode?.toUpperCase() || "US";
    }
  }, [area]);

  return (
    <PayPalScriptProvider
      options={{
        clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID,
        components: "buttons",
        locale: `${
          locale === "zh-cn" || locale === "zh-hk" ? "zh" : locale
        }_${countryCode}`,
        currency
      }}
    >
      <PayButton
        CONFIG={CONFIG}
        LANG={LANG}
        onCancel={onCancel}
        onError={onError}
        createOrder={createOrder}
        onApprove={onApprove}
      />
    </PayPalScriptProvider>
  );
}
