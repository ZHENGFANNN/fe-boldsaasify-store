"use client";

import React from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";

import Loading from "@/components/Loading";
import styles from "./index.module.scss";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ""
);

// 品牌化外观：对齐 BoldRadiant 商城（Open Sans / 主色 #272929 / 圆角 / 聚焦态），
// 不用 Stripe 原生灰白。参考企业级收银台（Shopify / Stripe 官方推荐）做法。
const APPEARANCE = {
  theme: "stripe",
  variables: {
    colorPrimary: "#272929",
    colorText: "#1a1a1a",
    colorTextSecondary: "#6b7280",
    colorBackground: "#ffffff",
    colorDanger: "#d92d20",
    fontFamily: "'Open Sans', 'Helvetica Neue', Arial, sans-serif",
    fontSizeBase: "15px",
    borderRadius: "10px",
    spacingUnit: "4px",
    spacingGridRow: "18px",
  },
  rules: {
    ".Label": {
      fontWeight: "600",
      fontSize: "13px",
      color: "#374151",
      marginBottom: "6px",
    },
    ".Input": {
      padding: "12px 14px",
      borderColor: "#e5e7eb",
      boxShadow: "none",
    },
    ".Input:focus": {
      borderColor: "#272929",
      boxShadow: "0 0 0 1px #272929",
    },
    ".Input::placeholder": { color: "#9ca3af" },
    ".Tab, .AccordionItem": { borderColor: "#e5e7eb", boxShadow: "none" },
    ".Tab:hover, .AccordionItem:hover": { borderColor: "#272929" },
    ".Tab--selected, .AccordionItem--selected": {
      borderColor: "#272929",
      boxShadow: "0 0 0 1px #272929",
    },
    ".Error": { fontSize: "13px" },
  },
};

// accordion + 单选 + 间距：多支付方式时纵向排列，不再挤成一排 tab。
const PAYMENT_ELEMENT_OPTIONS = {
  layout: {
    type: "accordion",
    defaultCollapsed: false,
    radios: true,
    spacedAccordionItems: true,
  },
  wallets: { applePay: "auto", googlePay: "auto" },
};

function CheckoutForm({ onSuccess, onError, LANG, returnUrl, amountLabel }) {
  const stripe = useStripe();
  const elements = useElements();
  const [ready, setReady] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!stripe || !elements || submitting) return;

    setSubmitting(true);
    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: returnUrl,
        },
        redirect: "if_required",
      });

      if (error) {
        onError?.(error);
        return;
      }

      if (
        paymentIntent &&
        (paymentIntent.status === "succeeded" ||
          paymentIntent.status === "processing")
      ) {
        onSuccess?.();
      }
    } catch (error) {
      onError?.(error);
    } finally {
      setSubmitting(false);
    }
  };

  const payText = LANG["common.pay.pay_button.pay_now"] || "Pay";
  const payLabel = amountLabel ? `${payText} ${amountLabel}` : payText;

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      {!ready ? <Loading height={108} /> : null}
      <div style={ready ? undefined : { display: "none" }}>
        <PaymentElement
          options={PAYMENT_ELEMENT_OPTIONS}
          onReady={() => setReady(true)}
        />
      </div>
      <button
        type="submit"
        className={styles.submit_btn}
        disabled={!stripe || !elements || !ready || submitting}
      >
        {submitting
          ? LANG["common.pay.pay_button.paying"] || "Processing..."
          : payLabel}
      </button>
      <div className={styles.secure_tip}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M12 2 4 5v6c0 5 3.4 8.5 8 11 4.6-2.5 8-6 8-11V5l-8-3Z"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
          <path
            d="m9 12 2 2 4-4"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span>
          {LANG["common.pay.pay_button.secure_tip"] ||
            "Secured by Stripe · Your payment info is encrypted"}
        </span>
      </div>
    </form>
  );
}

export default function StripePay({
  clientSecret,
  locale,
  onSuccess,
  onError,
  LANG,
  returnUrl,
  amountLabel,
}) {
  const stripeLocale = React.useMemo(() => {
    if (locale === "zh-cn" || locale === "zh-hk") return "zh";
    return locale || "auto";
  }, [locale]);

  if (!clientSecret) {
    return <Loading height={108} />;
  }

  return (
    <Elements
      stripe={stripePromise}
      options={{
        clientSecret,
        locale: stripeLocale,
        appearance: APPEARANCE,
      }}
    >
      <CheckoutForm
        LANG={LANG}
        onSuccess={onSuccess}
        onError={onError}
        returnUrl={returnUrl}
        amountLabel={amountLabel}
      />
    </Elements>
  );
}
