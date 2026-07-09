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

function CheckoutForm({ onSuccess, onError, LANG, onCreateOrder, amountLabel }) {
  const stripe = useStripe();
  const elements = useElements();
  const [ready, setReady] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);

  // Stripe Deferred 流程：先校验卡信息，此刻才建单拿 client_secret，最后扣款。
  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!stripe || !elements || submitting) return;

    setSubmitting(true);
    try {
      // 1. 校验卡信息（deferred 模式必须先于建单）
      const { error: submitError } = await elements.submit();
      if (submitError) {
        onError?.(submitError);
        return;
      }

      // 2. 点 Pay 这一刻才建单，拿回 client_secret + return_url
      const created = await onCreateOrder?.();
      if (!created?.clientSecret) {
        // 校验/建单失败：onCreateOrder 内部已提示
        return;
      }

      // 3. 扣款
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        clientSecret: created.clientSecret,
        confirmParams: {
          return_url: created.returnUrl,
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
  amount,
  currency,
  locale,
  onSuccess,
  onError,
  LANG,
  onCreateOrder,
  amountLabel,
}) {
  const stripeLocale = React.useMemo(() => {
    if (locale === "zh-cn" || locale === "zh-hk") return "zh";
    return locale || "auto";
  }, [locale]);

  if (!amount || amount <= 0 || !currency) {
    return <Loading height={108} />;
  }

  return (
    // Deferred PaymentIntent 模式：无 client_secret 即可挂载卡表单，
    // 建单推迟到用户点 Pay 时（见 CheckoutForm.handleSubmit）。
    <Elements
      stripe={stripePromise}
      options={{
        mode: "payment",
        amount,
        currency,
        locale: stripeLocale,
        appearance: APPEARANCE,
      }}
    >
      <CheckoutForm
        LANG={LANG}
        onSuccess={onSuccess}
        onError={onError}
        onCreateOrder={onCreateOrder}
        amountLabel={amountLabel}
      />
    </Elements>
  );
}
