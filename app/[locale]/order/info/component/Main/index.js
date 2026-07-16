"use client";

import styles from "../../page.module.scss";
import Api from "../../api";

import { track } from "@/utils/analytics";
import React from "react";
import Paypal from "../../../component/Paypal";
import StripePay from "../../../component/StripePay";
import ConfirmModal from "@/components/Modal/ConfirmModal";

import { useRouter } from "next/navigation";

import ShowTipModal from "@/components/Modal/ShowTipModal";
import Loading from "@/components/Loading";
import Button from "@/components/Button";
import CustomizeFileLink from "@/components/CustomizeFileLink";
import AuthRedirectGuard from "@/components/Auth/AuthRedirectGuard";
import { formatCurrency, formatDateTime } from "@/utils";
import { defaultLocale } from "@/config/languageSettings";

// 默认语言不带前缀，其它语言带 /{locale}（与 middleware buildLocalizedPath / 售后模块约定一致）。
const localeHref = (path, locale) =>
  locale && locale !== defaultLocale ? `/${locale}${path}` : path;

export default function Main({ secret, locale, area, LANG, CONFIG }) {
  const router = useRouter();
  const [order, setOrder] = React.useState();
  const [loading, setLoading] = React.useState(true);
  // 访问门禁：null=已通过 / "login"=用户订单需登录 / "email"=游客订单需邮箱校验
  const [gate, setGate] = React.useState(null);
  const [emailInput, setEmailInput] = React.useState("");
  const [emailErr, setEmailErr] = React.useState("");
  const [emailSubmitting, setEmailSubmitting] = React.useState(false);

  // 归一化订单数据（裁剪 order_list 到页面所需字段；user_remark / after_service 等随 ...data 透传）
  const normalizeOrder = React.useCallback((data) => {
    return {
      ...data,
      order_list: data.order_list.map((item) => {
        const {
          name,
          comboName,
          productNum,
          priceSymbol,
          priceCurrency,
          priceUnit,
          productPrice,
          options,
          image,
        } = item;
        return {
          name,
          comboName,
          productNum,
          priceSymbol,
          priceCurrency,
          priceUnit,
          productPrice,
          options,
          image,
          customize_data: Array.isArray(item.customize_data)
            ? item.customize_data
            : [],
        };
      }),
    };
  }, []);

  // 拉订单：带 secret（登录用户 token 由 axios 请求拦截器自动附加）；游客可带 email。
  // 返回："ok" 成功 / "login" 需登录 / "email" 需邮箱 / "error" 其它错误。
  const fetchOrder = React.useCallback(
    async (email) => {
      try {
        const res = await Api.getOrderDetail({
          secret,
          ...(email ? { email } : {}),
        });
        if (res.code === 0) {
          setOrder(normalizeOrder(res.data));
          setGate(null);
          return "ok";
        }
        if (res.code === 2107) return "login"; // OrderLoginRequired：用户订单未登录
        if (res.code === 2108) return "email"; // OrderEmailRequired：游客订单需邮箱匹配
        if (res.code === 10029) return "forbidden"; // OrderNotBelongUser：已登录但非本人
        return "error";
      } catch {
        // 10014（会话过期）由全局 AuthGateProvider/AuthBoundary 处理；其余网络错误按 error 处理
        return "error";
      }
    },
    [secret, normalizeOrder]
  );

  // 首次进入：先只带 secret 试；游客订单缺邮箱时，用结账记住的邮箱自动重试一次（刚下单无感）。
  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const r1 = await fetchOrder();
      if (cancelled) return;
      if (r1 === "ok") {
        setLoading(false);
        return;
      }
      if (r1 === "login" || r1 === "forbidden") {
        setGate(r1);
        setLoading(false);
        return;
      }
      if (r1 === "email") {
        const remembered =
          typeof window !== "undefined"
            ? window.localStorage.getItem("tourists_email") || ""
            : "";
        if (remembered) {
          const r2 = await fetchOrder(remembered);
          if (cancelled) return;
          if (r2 === "ok") {
            setEmailInput(remembered);
            setLoading(false);
            return;
          }
          setGate(r2 === "login" ? "login" : "email");
          setLoading(false);
          return;
        }
        setGate("email");
        setLoading(false);
        return;
      }
      // 其它错误：回首页（保持原行为）
      router.push("/");
    })();
    return () => {
      cancelled = true;
    };
  }, [fetchOrder, router]);

  // 游客邮箱门禁：提交邮箱做后端归属校验
  const handleEmailSubmit = React.useCallback(
    async (e) => {
      e?.preventDefault?.();
      const email = emailInput.trim();
      if (!email) {
        setEmailErr(
          LANG["store.order_info.email_gate_required"] ||
            "Please enter your email"
        );
        return;
      }
      setEmailSubmitting(true);
      setEmailErr("");
      const r = await fetchOrder(email);
      setEmailSubmitting(false);
      if (r === "ok") {
        if (typeof window !== "undefined") {
          window.localStorage.setItem("tourists_email", email);
        }
        return;
      }
      if (r === "login") {
        setGate("login");
        return;
      }
      setEmailErr(
        LANG["store.order_info.email_gate_error"] ||
          "This email does not match the order. Please try again."
      );
    },
    [emailInput, fetchOrder, LANG]
  );

  const payMap = React.useMemo(() => {
    return {
      wechat: LANG["store.order_info.wechat"],
      zhifubao: LANG["store.order_info.zhifubao"],
      bank: LANG["store.order_info.transfer"],
      creditCard: LANG["store.order_info.credit_card"],
      payPal: LANG["store.order_info.paypal"],
      // 与 checkout PayList / My Orders 一致：Stripe 不显示为 Credit Card
      stripe:
        LANG["common.pay.pay_info.pay_list.stripe_detail"]?.split(" ")[0] ||
        "Stripe",
      cod: LANG["store.order_info.pay_after_arrival"],
    };
  }, [LANG]);

  const orderStatus = React.useMemo(() => {
    return {
      pending_payment:
        LANG["store.order_info.await_pay"] || "Pending payment",
      paid: LANG["store.order_info.await_deliver"] || "To be delivered",
      shipped: LANG["store.order_info.delivered"] || "Shipped",
      delivered: LANG["store.order_info.received"] || "Delivered",
      completed: LANG["store.order_info.finished"] || "Completed",
      cancelled: LANG["store.order_info.cancelled"] || "Cancelled",
      refunding: LANG["store.order_info.refunding"] || "Refunding",
      refunded: LANG["store.order_info.refunded"] || "Refunded",
      closed: LANG["store.order_info.closed"] || "Closed",
    };
  }, [LANG]);

  const orderStatusColor = React.useMemo(() => {
    return {
      pending_payment: styles.error,
      paid: styles.yellow,
      shipped: styles.blue,
      delivered: styles.blue,
      completed: styles.green,
      cancelled: styles.black,
      refunding: styles.yellow,
      refunded: styles.black,
      closed: styles.black,
    };
  }, []);

  const fmtDateTime = React.useCallback(
    (time) => formatDateTime({ time, locale, area }),
    [locale, area]
  );

  // COD / Bank 提示语：来自 ERP 后台 setting.pay.[channel].message 多语言配置
  // - 仅 order.pay_key === 'cod' 或 'bank' 展示；其他支付方式不渲染节点
  // - locale 大小写归一后再取（后端存 zh-CN/大写 CN，前端 locale 为 zh-cn/小写）
  // - 优先当前 locale，缺失回退 en；两者都空则不显示
  const payNoticeMessage = React.useMemo(() => {
    const key = order?.pay_key;
    if (key !== "cod" && key !== "bank") return "";
    const msg = CONFIG?.["setting.pay"]?.[key]?.message;
    if (!msg || typeof msg !== "object") return "";
    // 构造 lower-case key 索引：兼容 zh-CN / zh-cn / EN / en 等任意大小写
    const lc = {};
    for (const k of Object.keys(msg)) lc[k.toLowerCase()] = msg[k];
    const target = String(locale || "").toLowerCase();
    const localized = lc[target] || lc.en;
    return typeof localized === "string" ? localized.trim() : "";
  }, [order?.pay_key, CONFIG, locale]);

  const tipRef = React.useRef(null);
  const showTip = React.useCallback(({ text, type }) => {
    tipRef.current.show({ text, type });
  }, []);

  const copyText = React.useCallback((text) => {
    // 创建一个临时的 textarea 元素
    const textarea = document.createElement("textarea");
    textarea.value = text;

    // 将 textarea 添加到页面中
    document.body.appendChild(textarea);

    // 选择并复制文本
    textarea.select();
    document.execCommand("copy");

    // 移除临时元素
    document.body.removeChild(textarea);
  }, []);

  // Stripe 二次支付：点击后向后端找回/重建支付会话，成功则内嵌 PaymentElement
  const [repayClientSecret, setRepayClientSecret] = React.useState(null);
  const [repayLoading, setRepayLoading] = React.useState(false);
  const handleRepay = React.useCallback(async () => {
    if (repayLoading) return;
    setRepayLoading(true);
    try {
      const res = await Api.stripeRepay({ secret });
      if (res.code === 0 && res.data?.client_secret) {
        setRepayClientSecret(res.data.client_secret);
      } else if (res.code === 2105 || res.code === 2106) {
        // 已支付/已关闭：状态已变，刷新对齐
        if (res.code === 2105) {
          showTip({
            text:
              LANG["store.order_info.already_paid"] ||
              "This order has already been paid",
            type: "success",
          });
        }
        setTimeout(() => window.location.reload(), 1000);
      } else {
        throw new Error("repay failed");
      }
    } catch {
      showTip({ text: LANG["store.order_info.pay_error"], type: "error" });
    } finally {
      setRepayLoading(false);
    }
  }, [repayLoading, secret, showTip, LANG]);

  const [cancelLoading, setCancelLoading] = React.useState(false);
  const handleCancelOrder = React.useCallback(async () => {
    if (cancelLoading) return;
    setCancelLoading(true);
    try {
      const res = await Api.cancelOrder({ secret });
      if (res.code === 0) {
        showTip({
          text: LANG["store.order_info.cancel_success"] || "Order cancelled",
          type: "success",
        });
        setTimeout(() => window.location.reload(), 1000);
      } else if (res.code === 2105) {
        showTip({
          text:
            LANG["store.order_info.already_paid"] ||
            "This order has already been paid",
          type: "success",
        });
        setTimeout(() => window.location.reload(), 1000);
      } else {
        throw new Error("cancel failed");
      }
    } catch {
      showTip({
        text: LANG["store.order_info.cancel_fail"] || "Failed to cancel order",
        type: "error",
      });
    } finally {
      setCancelLoading(false);
    }
  }, [cancelLoading, secret, showTip, LANG]);

  // Stripe 二次支付 return_url：只用 secret，不带 payment_intent 等回调参数
  const repayReturnUrl = React.useMemo(() => {
    if (typeof window === "undefined") return "";
    return `${window.location.origin}${window.location.pathname}?secret=${secret}`;
  }, [secret]);

  const handleStripeRepayConfirm = React.useCallback(async () => {
    if (!repayClientSecret) return null;
    return { clientSecret: repayClientSecret, returnUrl: repayReturnUrl };
  }, [repayClientSecret, repayReturnUrl]);

  return (
    <div className={styles.container}>
      {gate === "login" ? (
        // 用户订单未登录：强制登录守卫（登录成功后回跳本页，带 token 自动通过归属校验）
        <AuthRedirectGuard LANG={LANG} />
      ) : gate === "forbidden" ? (
        // 已登录但非订单归属者：无权限提示
        <div className={styles.email_gate}>
          <svg
            className={styles.lock_icon}
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <rect
              x="4"
              y="10.5"
              width="16"
              height="10"
              rx="2.5"
              stroke="currentColor"
              strokeWidth="1.6"
            />
            <path
              d="M7.5 10.5V8a4.5 4.5 0 0 1 9 0v2.5"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
            <circle cx="12" cy="15" r="1.4" fill="currentColor" />
          </svg>
          <h2>
            {LANG["store.order_info.forbidden_title"] || "Access denied"}
          </h2>
          <p className={styles.gate_desc}>
            {LANG["store.order_info.forbidden_desc"] ||
              "This order isn't associated with your account. Please sign in with the account used to place it."}
          </p>
          <button type="button" onClick={() => router.push("/")}>
            {LANG["store.order_info.back_home"] || "Back to home"}
          </button>
        </div>
      ) : gate === "email" ? (
        // 游客订单：邮箱归属校验门禁
        <div className={styles.email_gate}>
          <svg
            className={styles.lock_icon}
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <rect
              x="4"
              y="10.5"
              width="16"
              height="10"
              rx="2.5"
              stroke="currentColor"
              strokeWidth="1.6"
            />
            <path
              d="M7.5 10.5V8a4.5 4.5 0 0 1 9 0v2.5"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
            <circle cx="12" cy="15" r="1.4" fill="currentColor" />
            <path
              d="M12 16.2v1.6"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          </svg>
          <h2>
            {LANG["store.order_info.email_gate_title"] || "Verify your email"}
          </h2>
          <p className={styles.gate_desc}>
            {LANG["store.order_info.email_gate_desc"] ||
              "For your security, please enter the email you used to place this order to view its details."}
          </p>
          <form onSubmit={handleEmailSubmit}>
            <input
              type="email"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              placeholder={
                LANG["store.order_info.email_gate_placeholder"] ||
                "Enter your order email"
              }
              autoComplete="email"
            />
            {emailErr ? (
              <div className={styles.gate_error}>{emailErr}</div>
            ) : null}
            <button type="submit" disabled={emailSubmitting}>
              {emailSubmitting
                ? "..."
                : LANG["store.order_info.email_gate_submit"] || "View order"}
            </button>
          </form>
        </div>
      ) : loading || !order ? (
        <div className={styles.loading_container}>
          <Loading />
        </div>
      ) : (
        <>
          <div className={styles.order_container}>
            <h3>{LANG["store.order_info.order_info"]}</h3>
            <div
              className={styles.order_description}
              dangerouslySetInnerHTML={{
                __html: LANG["store.order_info.contact_us"]
                  ?.split("${1}")
                  .join(`/support/contact`),
              }}
            />
            <div className={styles.copy_container}>
              <div
                className={styles.copy_order}
                onClick={() => {
                  showTip({
                    type: "success",
                    text: LANG["store.order_info.copy_success"],
                  });
                  copyText(window.location.href);
                }}
              >
                {LANG["store.order_info.copy_order"]}
              </div>
            </div>
            {payNoticeMessage ? (
              <div
                className={`${styles.pay_notice} ${
                  order.pay_key === "cod"
                    ? styles.pay_notice_cod
                    : styles.pay_notice_bank
                }`}
              >
                <h4>
                  {order.pay_key === "cod"
                    ? payMap.cod
                    : payMap.bank}
                </h4>
                <p>{payNoticeMessage}</p>
              </div>
            ) : null}
            <ul className={styles.order_list}>
              <h2>{LANG["store.order_info.order_info"]}</h2>
              <li>
                <h3 className={styles.flex_2}>
                  {LANG["store.order_info.order_number"]}
                </h3>
                <p className={styles.flex_3}>{order.order_number}</p>
              </li>
              <li>
                <h3 className={styles.flex_2}>
                  {LANG["store.order_info.order_time"]}
                </h3>
                <p className={styles.flex_3}>
                  {fmtDateTime(order.order_time)}
                </p>
              </li>
              {order.pay_time ? (
                <li>
                  <h3 className={styles.flex_2}>
                    {LANG["store.order_info.pay_time"]}
                  </h3>
                  <p className={styles.flex_3}>
                    {fmtDateTime(order.pay_time)}
                  </p>
                </li>
              ) : null}

              {order.deliver_time ? (
                <li>
                  <h3 className={styles.flex_2}>
                    {LANG["store.order_info.deliver_time"]}
                  </h3>
                  <p className={styles.flex_3}>
                    {fmtDateTime(order.deliver_time)}
                  </p>
                </li>
              ) : null}

              {order.finish_time ? (
                <li>
                  <h3 className={styles.flex_2}>
                    {LANG["store.order_info.finish_time"]}
                  </h3>
                  <p className={styles.flex_3}>
                    {fmtDateTime(order.finish_time)}
                  </p>
                </li>
              ) : null}

              <li>
                <h3 className={styles.flex_2}>
                  {LANG["store.order_info.order_status"]}
                </h3>
                <p className={styles.flex_3}>
                  <span className={orderStatusColor[order.order_status] || ""}>
                    {orderStatus[order.order_status]}
                  </span>
                </p>
              </li>
              <li>
                <h3 className={styles.flex_2}>
                  {LANG["store.order_info.pay_way"]}
                </h3>
                <p className={styles.flex_3}>{payMap[order.pay_key]}</p>
              </li>
              <li>
                <h3 className={styles.flex_2}>
                  {LANG["store.order_info.order_total"]}
                </h3>
                <p className={styles.flex_3}>{`${
                  order.order_list[0].priceSymbol
                }${formatCurrency(
                  order.total_price,
                  order.order_list[0].priceUnit,
                )}`}</p>
              </li>

              {(() => {
                const symbol = order.order_list[0].priceSymbol;
                const unit = order.order_list[0].priceUnit;
                const money = (v) => `${symbol}${formatCurrency(v, unit)}`;
                // 逐项折扣明细（后端随订单下发；老订单为空 → 回退聚合展示）。
                let applied = [];
                try {
                  applied = Array.isArray(order.applied_discounts)
                    ? order.applied_discounts
                    : order.applied_discounts
                      ? JSON.parse(order.applied_discounts)
                      : [];
                } catch {
                  applied = [];
                }
                const shipDiscounts = applied.filter(
                  (d) => d.type === "free_shipping",
                );
                const itemDiscounts = applied.filter(
                  (d) => d.type !== "free_shipping",
                );
                const discountLabel = (d) =>
                  d.code ||
                  d.title ||
                  LANG["store.order_info.discount_price"] ||
                  "Discount";
                const shippingLabel =
                  LANG["store.order_info.express_price"] ||
                  LANG["store.order.express_price"] ||
                  "Shipping";

                // 有逐项明细：每个折扣（含运费折扣）单独成行，运费折扣紧跟运费展示。
                if (applied.length > 0) {
                  return (
                    <>
                      {itemDiscounts.map((d, i) => (
                        <li key={`disc-${i}`}>
                          <h3 className={styles.flex_2}>{discountLabel(d)}</h3>
                          <p className={styles.flex_3}>
                            <span className={styles.red}>{`- ${money(
                              Number(d.amount) || 0,
                            )}`}</span>
                          </p>
                        </li>
                      ))}
                      {Number(order.shipping_fee) > 0 ? (
                        <li>
                          <h3 className={styles.flex_2}>{shippingLabel}</h3>
                          <p className={styles.flex_3}>
                            {money(order.shipping_fee)}
                          </p>
                        </li>
                      ) : null}
                      {shipDiscounts.map((d, i) => (
                        <li key={`ship-${i}`}>
                          <h3 className={styles.flex_2}>
                            {LANG["store.order_info.shipping_discount"] ||
                              "Shipping discount"}
                          </h3>
                          <p className={styles.flex_3}>
                            <span className={styles.red}>{`- ${money(
                              Number(d.amount) || 0,
                            )}`}</span>
                          </p>
                        </li>
                      ))}
                      {order.pay_price ? (
                        <li>
                          <h3 className={styles.flex_2}>
                            {LANG["store.order_info.pay_price"]}
                          </h3>
                          <p className={styles.flex_3}>
                            {money(order.pay_price)}
                          </p>
                        </li>
                      ) : null}
                    </>
                  );
                }

                // 无逐项明细（老订单）：回退聚合展示（与原逻辑一致）。
                return (
                  <>
                    {order.discount ? (
                      <>
                        <li>
                          <h3 className={styles.flex_2}>
                            {LANG["store.order_info.discount_price"]}
                          </h3>
                          <p className={styles.flex_3}>
                            <span className={styles.red}>{`- ${money(
                              order.discount,
                            )}`}</span>
                          </p>
                        </li>
                        <li>
                          <h3 className={styles.flex_2}>
                            {LANG["store.order_info.real_price"]}
                          </h3>
                          <p className={styles.flex_3}>
                            {money(
                              order.subtotal_after_discount ?? order.total_price,
                            )}
                          </p>
                        </li>
                      </>
                    ) : null}
                    {Number(order.shipping_fee) > 0 ? (
                      <li>
                        <h3 className={styles.flex_2}>{shippingLabel}</h3>
                        <p className={styles.flex_3}>
                          {money(order.shipping_fee)}
                        </p>
                      </li>
                    ) : null}
                    {order.pay_price ? (
                      <li>
                        <h3 className={styles.flex_2}>
                          {LANG["store.order_info.pay_price"]}
                        </h3>
                        <p className={styles.flex_3}>
                          {money(order.pay_price)}
                        </p>
                      </li>
                    ) : null}
                  </>
                );
              })()}

              {order.express_link ? (
                <li>
                  <h3 className={styles.flex_2}>
                    {LANG["store.order_info.express_link"]}
                  </h3>
                  <a
                    target="_blank"
                    href={order.express_link}
                    className={styles.flex_3}
                  >{`${order.express_link}`}</a>
                </li>
              ) : null}

              {order.user_remark ? (
                <li>
                  <h3 className={styles.flex_2}>
                    {LANG["store.order_info.order_remark"]}
                  </h3>
                  <p className={styles.flex_3}>{`${order.user_remark}`}</p>
                </li>
              ) : null}

              <h2>{LANG["store.order_info.good_info"]}</h2>
              <div className={styles.good_list}>
                {order.order_list.map((goodItem, goodIndex) => {
                  return (
                    <div key={goodIndex} className={styles.good_item}>
                      <div className={styles.product_info}>
                        <div className={styles.good_img}>
                          <img src={goodItem.image} alt={goodItem.name} />
                        </div>
                        <div className={styles.good_info}>
                          <div className={styles.good_name}>
                            {goodItem.name}
                          </div>
                          <div className={styles.combo_name}>
                            {goodItem.comboName}
                          </div>
                          <div className={styles.good_option}>
                            {goodItem.options?.map((option, optionIndex) => {
                              return (
                                <div
                                  key={optionIndex}
                                >{`${option.name}: ${option.value}`}</div>
                              );
                            })}
                          </div>
                          {/* 定制字段：文本显示值，文件显示文件名(可点开)。与结算/购物车同口径。 */}
                          {Array.isArray(goodItem.customize_data) &&
                          goodItem.customize_data.length > 0 ? (
                            <div className={styles.good_option}>
                              {goodItem.customize_data.map((field, fi) => {
                                const isFile =
                                  field.field_type === "file" ||
                                  (Array.isArray(field.files) &&
                                    field.files.length > 0);
                                if (isFile) {
                                  const files = Array.isArray(field.files)
                                    ? field.files
                                    : [];
                                  if (!files.length) return null;
                                  return (
                                    <div key={fi}>
                                      {`${field.field_label}: `}
                                      {files.map((f, idx) => (
                                        <React.Fragment key={`${f.url}-${idx}`}>
                                          <CustomizeFileLink file={f} />
                                          {idx < files.length - 1 ? ", " : ""}
                                        </React.Fragment>
                                      ))}
                                    </div>
                                  );
                                }
                                if (!field.value) return null;
                                return (
                                  <div
                                    key={fi}
                                  >{`${field.field_label}: ${field.value}`}</div>
                                );
                              })}
                            </div>
                          ) : null}
                          <div className={styles.good_number}>
                            × {goodItem.productNum}
                          </div>
                        </div>
                      </div>
                      <div className={styles.product_number}>
                        <div className={styles.good_price}>{`${
                          goodItem.priceSymbol
                        }${formatCurrency(
                          goodItem.productPrice * goodItem.productNum,
                          order.order_list[0].priceUnit,
                        )}`}</div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {order.first_name && order.address1 ? (
                <div className={styles.user_info}>
                  <h2>{LANG["store.order_info.user_info"]}</h2>
                  <li>
                    <p>{`${order.first_name} ${order.last_name}`}</p>
                  </li>
                  <li>
                    <p>{order.email}</p>
                  </li>
                  <li>
                    <p>{`${order.short_phone ? `(${order.short_phone}) ` : ""}${
                      order.phone
                    }`}</p>
                  </li>
                  <li>
                    <p>{`(${order.zip_code}) ${order.area_text} ${order.address1} ${order.address2}`}</p>
                  </li>
                </div>
              ) : null}
            </ul>
            {order.order_status === "pending_payment" ? (
              <div className={styles.btn_container}>
                {order.pay_key === "payPal" ? (
                  <Paypal
                    LANG={LANG}
                    CONFIG={CONFIG}
                    area={order.area_code || area}
                    locale={locale}
                    order_number={order.order_number}
                    currency={order.order_list[0].priceCurrency}
                    onError={(error) => {
                      console.log(error);
                      showTip({
                        text: LANG["store.order_info.pay_error"],
                        type: "error",
                      });
                    }}
                    onCancel={(data) => {
                      if (data.orderID) {
                        showTip({
                          text: LANG["store.order_info.pay_cancel"],
                          type: "error",
                        });
                      }
                    }}
                    createOrder={() => {
                      return order.order_number;
                    }}
                    onApprove={(data) => {
                      return Api.confirmPaypal({
                        id: data.orderID,
                        from:
                          order.first_name && order.address1
                            ? "order_page"
                            : "",
                      })
                        .then((res) => {
                          if (res.code === 0) {
                            track("Purchase", {
                              from: "order_info_page",
                              currency: res.data.currency_code,
                              value: res.data.value,
                              discount: order.discount,
                              contents: order.order_list,
                              type: "payPal",
                            });
                            showTip({
                              text: LANG["store.order_info.pay_success"],
                              type: "success",
                            });
                            // 移除订单信息
                            localStorage.removeItem("order");
                            setTimeout(() => {
                              window.location.reload();
                            }, 1000);
                          } else {
                            throw new Error("code !== 0");
                          }
                        })
                        .catch(() => {
                          showTip({
                            text: LANG["store.order_info.pay_fail"],
                            type: "error",
                          });
                        });
                    }}
                  />
                ) : null}
                {order.pay_key === "stripe" ? (
                  !repayClientSecret ? (
                    <div className={styles.repay_btn} onClick={handleRepay}>
                      {repayLoading
                        ? "..."
                        : LANG["store.order_info.continue_pay"] ||
                          "Continue Payment"}
                    </div>
                  ) : (
                    <StripePay
                      amount={Math.round(
                        (order.pay_price || order.total_price) *
                          (order.order_list[0].priceUnit || 100),
                      )}
                      currency={order.order_list[0].priceCurrency.toLowerCase()}
                      locale={locale}
                      LANG={LANG}
                      onCreateOrder={handleStripeRepayConfirm}
                      amountLabel={`${
                        order.order_list[0].priceSymbol
                      }${formatCurrency(
                        order.pay_price || order.total_price,
                        order.order_list[0].priceUnit,
                      )}`}
                      onError={() => {
                        showTip({
                          text: LANG["store.order_info.pay_error"],
                          type: "error",
                        });
                      }}
                      onSuccess={() => {
                        track("Purchase", {
                          from: "order_info_page",
                          currency: order.order_list[0].priceCurrency,
                          value: order.pay_price,
                          discount: order.discount,
                          contents: order.order_list,
                          type: "stripe",
                        });
                        showTip({
                          text: LANG["store.order_info.pay_success"],
                          type: "success",
                        });
                        localStorage.removeItem("order");
                        setTimeout(() => {
                          window.location.reload();
                        }, 1000);
                      }}
                    />
                  )
                ) : null}
                <div className={styles.cancel_wrap}>
                  <ConfirmModal
                    title={
                      LANG["store.order_info.cancel_order"] || "Cancel Order"
                    }
                    content={
                      LANG["store.order_info.cancel_order_confirm"] ||
                      "Are you sure you want to cancel this order? This cannot be undone."
                    }
                    onOk={handleCancelOrder}
                    renderNode={
                      <Button
                        variant="ghost"
                        block
                        loading={cancelLoading}
                        className={styles.cancel_btn}
                      >
                        {LANG["store.order_info.cancel_order"] ||
                          "Cancel Order"}
                      </Button>
                    }
                  />
                </div>
              </div>
            ) : null}
            {/* 售后入口：有关联工单 → 售后进度；已完成且无工单 → 申请售后。
                after_service 仅登录用户订单存在（游客订单后端不下发该字段，天然不显示按钮）。 */}
            {order.after_service ? (
              <div className={styles.btn_container}>
                <Button
                  variant="ghost"
                  block
                  className={styles.after_sale_btn}
                  onClick={() =>
                    router.push(
                      localeHref(
                        `/support/after-sales/detail?no=${encodeURIComponent(
                          order.after_service.service_no,
                        )}`,
                        locale,
                      ),
                    )
                  }
                >
                  {LANG["store.order_info.after_service_progress"] ||
                    "After-Sales Progress"}
                </Button>
              </div>
            ) : order.order_status === "completed" ? (
              <div className={styles.btn_container}>
                <Button
                  variant="ghost"
                  block
                  className={styles.after_sale_btn}
                  onClick={() =>
                    router.push(
                      localeHref(
                        `/support/after-sales/create?orderNumber=${encodeURIComponent(
                          order.order_number,
                        )}`,
                        locale,
                      ),
                    )
                  }
                >
                  {LANG["store.order_info.apply_after_service"] ||
                    "Apply for After-Sales"}
                </Button>
              </div>
            ) : null}
          </div>
        </>
      )}
      <ShowTipModal ref={tipRef} />
    </div>
  );
}
