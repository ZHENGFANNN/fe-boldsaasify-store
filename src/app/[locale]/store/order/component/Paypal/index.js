"use client";

import {
  PayPalScriptProvider,
  PayPalButtons,
  usePayPalScriptReducer,
} from "@paypal/react-paypal-js";
import React from "react";
import Loading from "@/components/Loading";

function PayButton({ createOrder, onApprove, onCancel, onError }) {
  const [{ isPending }] = usePayPalScriptReducer();

  return (
    <>
      {isPending ? (
        <Loading height={108} />
      ) : (
        <PayPalButtons
          style={{
            layout: "vertical",
            color: "gold",
            label: "paypal",
            "disable-country-change": "true",
          }}
          createOrder={createOrder}
          onApprove={onApprove}
          onCancel={onCancel}
          onError={onError}
        />
      )}
    </>
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
}) {
  console.log("currency", currency, area);
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
          locale === "hk" || locale === "cn" ? "zh" : locale
        }_${countryCode}`,
        currency,
      }}
    >
      <PayButton
        onCancel={onCancel}
        onError={onError}
        createOrder={createOrder}
        onApprove={onApprove}
      />
    </PayPalScriptProvider>
  );
}
