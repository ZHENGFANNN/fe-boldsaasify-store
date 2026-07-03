/** @format */

"use client";

import ReactDOM from "react-dom";
import React from "react";
import {
  PayPalScriptProvider,
  PayPalButtons,
  usePayPalScriptReducer
} from "@paypal/react-paypal-js";
import { useRouter } from "next/navigation";

import Loading from "@/components/Loading";
import ShowTipModal from "@/components/Modal/ShowTipModal";
import { formatCurrency, roundToDecimalPlaces } from "@/utils";
import {
  readStoredDiscountCodes,
  writeStoredDiscountCodes,
  formatRejectedCodeMessage
} from "@/utils/discount-codes";

import Api from "../../../../api";
import tracking from "../../../../tracking";
import styles from "./index.module.scss";

function parsePreviewAmount(value) {
  if (typeof value === "number") return value;
  return parseFloat(value) || 0;
}

// 抽屉内 PayPal 快捷支付：与详情页 PayButton 同构，差别是把用户在抽屉里输入的
// discount_codes 一并传入 previewOrder / createOrder，实现「填码 + 快捷支付」闭环。
function DrawerPayButton({
  LANG,
  CONFIG,
  locale,
  area,
  orderList,
  orderPricing,
  discountCodes,
  customizeRef,
  onValidate
}) {
  const [{ isPending, isRejected, options }, dispatch] =
    usePayPalScriptReducer();
  const router = useRouter();
  const tipRef = React.useRef(null);
  const secret = React.useRef();
  const showTip = React.useCallback(({ text, type }) => {
    tipRef.current?.show({ text, type });
  }, []);

  const trackingInitiateCheckout = React.useCallback(() => {
    tracking.initiateCheckout({
      currency: orderList[0]?.priceCurrency,
      value: orderPricing.pay_price,
      discount: orderPricing.discount,
      type: "payPal",
      contents: orderList
    });
  }, [orderList, orderPricing]);

  if (isRejected) {
    return (
      <div className={styles.pay_error_container}>
        <div
          className={styles.btn_container}
          onClick={() => {
            dispatch({ type: "resetOptions", value: options });
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

  return (
    <>
      {isPending ? (
        <Loading height={108} />
      ) : (
        <PayPalButtons
          style={{ layout: "vertical", color: "gold", label: "paypal" }}
          forceReRender={[orderPricing.pay_price, discountCodes.join(","), locale]}
          createOrder={async () => {
            // 定制字段必填校验：未通过则内联报错并阻断下单（PayPal 合约需 reject）
            if (onValidate && !onValidate()) {
              throw new Error("customize validate failed");
            }
            const payload = {
              pay_key: "payPal",
              total_price: orderPricing.total_price,
              shipping_fee: orderPricing.shipping_fee,
              discount: orderPricing.discount,
              pay_price: orderPricing.pay_price,
              pricing_area_code: area,
              order_list: orderList
            };
            if (discountCodes.length) payload.discount_codes = discountCodes;
            return Api.createOrder(payload)
              .then((res) => {
                if (res.code === 0) {
                  secret.current = res.data.secret;
                  trackingInitiateCheckout();
                  localStorage.setItem(
                    "order",
                    JSON.stringify({ secret: res.data.secret, time: Date.now() })
                  );
                  return res.data.id;
                }
                throw new Error("code !== 0");
              })
              .catch((error) => {
                console.log(`[BuyNowDrawer createOrder]: ${error}`);
                showTip({
                  text: LANG["common.pay.pay_button.create_error"],
                  type: "error"
                });
              });
          }}
          onApprove={(data) => {
            return Api.confirmPaypal({ id: data.orderID })
              .then((res) => {
                if (res.code === 0) {
                  tracking.purchase({
                    currency: res.data.currency_code,
                    value: res.data.value,
                    discount: orderPricing.discount,
                    type: "payPal",
                    contents: orderList
                  });
                  showTip({
                    text: LANG["common.pay.pay_button.pay_success"],
                    type: "success"
                  });
                  localStorage.removeItem("order");
                  setTimeout(() => {
                    router.push(`/order/info?secret=${res.data.secret}`);
                  }, 1000);
                } else {
                  throw new Error("code !== 0");
                }
              })
              .catch(() => {
                showTip({
                  text: LANG["common.pay.pay_button.pay_fail_tip"],
                  type: "error"
                });
              });
          }}
          onCancel={() => {
            return;
          }}
          onError={(error) => {
            console.log(`[BuyNowDrawer onError]: ${error}`);
            showTip({
              text: LANG["common.pay.pay_button.pay_error"],
              type: "error"
            });
          }}
        />
      )}
      <ShowTipModal ref={tipRef} />
    </>
  );
}

export default function BuyNowDrawer({
  open,
  onClose,
  LANG,
  CONFIG,
  locale,
  area,
  currency,
  countryCode,
  paypalEnabled,
  productInfo,
  productCurCombo,
  productNum,
  cartOptions,
  customizeRef
}) {
  // 抽屉开合动画：与 CartModal 一致，关闭时延迟卸载以播放退出动画。
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => {
    let t = null;
    if (open) {
      setMounted(true);
    } else {
      t = setTimeout(() => setMounted(false), 300);
    }
    return () => clearTimeout(t);
  }, [open]);

  // 打开时锁 body 滚动。
  React.useEffect(() => {
    if (typeof document === "undefined") return;
    if (open) {
      document.body.style.overflow = "hidden";
    }
    return () => {
      if (open) document.body.style.overflow = "";
    };
  }, [open]);

  // ---------- 折扣码状态机（产品码 / 订单码统一入口，后端区分类型） ----------
  const [discountCodeInput, setDiscountCodeInput] = React.useState("");
  const [discountCodes, setDiscountCodes] = React.useState(() =>
    readStoredDiscountCodes()
  );
  const [previewLoading, setPreviewLoading] = React.useState(false);
  const [previewData, setPreviewData] = React.useState(null);
  const [previewError, setPreviewError] = React.useState(null);
  const [rejectionNotice, setRejectionNotice] = React.useState(null);

  const unit = productCurCombo?.areaInfo?.currency_unit;
  const symbol = productCurCombo?.areaInfo?.currency_symbol || "";

  // 当前商品单行清单（快捷购买只结算当前所选变体 × 数量）。
  const orderList = React.useMemo(() => {
    return [
      {
        id: productCurCombo.id,
        comboName: productCurCombo.title,
        priceSymbol: productCurCombo.areaInfo?.currency_symbol,
        priceCurrency: productCurCombo.areaInfo?.currency,
        priceUnit: productCurCombo.areaInfo?.currency_unit,
        productPrice: productCurCombo.areaInfo?.product_price,
        sellingPrice: productCurCombo.areaInfo?.selling_price,
        productDiscount: productCurCombo.areaInfo?.product_discount || 0,
        stock: productCurCombo.areaInfo?.stock,
        name: productInfo.name,
        image: Array.isArray(productInfo.image_list)
          ? productInfo.image_list[0]?.src
          : undefined,
        href: `/${locale}/product/${productInfo.sort_key}/${productInfo.key}`,
        sortKey: productInfo.sort_key,
        productKey: productInfo.key,
        comboKey: productCurCombo.key,
        productNum,
        options: cartOptions,
        customize_data: customizeRef?.current?.getData
          ? customizeRef.current.getData()
          : []
      }
    ];
  }, [productCurCombo, productInfo, productNum, cartOptions, locale, customizeRef]);

  const subtotalPrice = React.useMemo(() => {
    return roundToDecimalPlaces(
      (productCurCombo.areaInfo?.product_price || 0) * productNum,
      unit
    );
  }, [productCurCombo, productNum, unit]);

  const fetchPreview = React.useCallback(
    async (codes) => {
      setPreviewLoading(true);
      try {
        const res = await Api.previewOrder({
          area_code: area,
          include_automatic: true,
          discount_codes: codes,
          order_list: orderList
        });
        if (res.code !== 0) {
          const msg =
            typeof res.data === "string"
              ? res.data
              : LANG["store.order.discount_code_invalid"] ||
                "Invalid discount code";
          throw new Error(msg);
        }
        const data = {
          total_price: parsePreviewAmount(res.data.total_price),
          shipping_fee: parsePreviewAmount(res.data.shipping_fee),
          discount: parsePreviewAmount(res.data.discount),
          pay_price: parsePreviewAmount(res.data.pay_price),
          applied_rules: res.data.applied_rules || [],
          rejected_codes: res.data.rejected_codes || []
        };
        setPreviewData(data);
        setPreviewError(null);
        return data;
      } catch (err) {
        setPreviewError(err?.message || "Preview failed");
        throw err;
      } finally {
        setPreviewLoading(false);
      }
    },
    [area, orderList, LANG]
  );

  // 坏码自愈：previewOrder 返回 rejected_codes 从已应用列表剔除并落盘。
  const reconcileRejected = React.useCallback(
    (data) => {
      const rejected = data?.rejected_codes || [];
      if (!rejected.length) return new Set();
      const rejectedSet = new Set(rejected.map((r) => r.code));
      setDiscountCodes((prev) => {
        const next = prev.filter((c) => !rejectedSet.has(c));
        if (next.length !== prev.length) writeStoredDiscountCodes(next);
        return next;
      });
      setRejectionNotice(
        rejected.map((r) => formatRejectedCodeMessage(r, LANG)).join("；")
      );
      return rejectedSet;
    },
    [LANG]
  );

  // 打开 / area / codes 变化时试算（含自动折扣，故无码也算一次拿总价与自动促销）。
  React.useEffect(() => {
    if (!open) return;
    fetchPreview(discountCodes)
      .then((data) => reconcileRejected(data))
      .catch(() => {});
  }, [open, area, discountCodes, fetchPreview, reconcileRejected]);

  const handleApply = React.useCallback(async () => {
    const code = discountCodeInput.trim().toUpperCase();
    if (!code) return;
    setRejectionNotice(null);
    if (discountCodes.includes(code)) {
      setPreviewError(
        LANG["store.order.discount_code_applied"] ||
          "Discount code already applied"
      );
      return;
    }
    const next = [...discountCodes, code];
    try {
      const data = await fetchPreview(next);
      const rejectedSet = reconcileRejected(data);
      if (rejectedSet.has(code)) {
        setDiscountCodeInput("");
        return;
      }
      const accepted = next.filter((c) => !rejectedSet.has(c));
      setDiscountCodes(accepted);
      writeStoredDiscountCodes(accepted);
      setDiscountCodeInput("");
    } catch {
      // fetchPreview 已 setPreviewError
    }
  }, [discountCodeInput, discountCodes, fetchPreview, reconcileRejected, LANG]);

  const handleRemove = React.useCallback(
    (code) => {
      const next = discountCodes.filter((c) => c !== code);
      setDiscountCodes(next);
      writeStoredDiscountCodes(next);
      setPreviewError(null);
      setRejectionNotice(null);
    },
    [discountCodes]
  );

  const orderPricing = React.useMemo(() => {
    const total_price = previewData?.total_price ?? subtotalPrice;
    const shipping_fee = previewData?.shipping_fee ?? 0;
    const discount = previewData?.discount ?? 0;
    const pay_price = previewData?.pay_price ?? subtotalPrice + shipping_fee;
    return {
      total_price: roundToDecimalPlaces(total_price, unit),
      shipping_fee: roundToDecimalPlaces(shipping_fee, unit),
      discount: roundToDecimalPlaces(discount, unit),
      pay_price: roundToDecimalPlaces(pay_price, unit)
    };
  }, [previewData, subtotalPrice, unit]);

  const validateCustomize = React.useCallback(() => {
    if (customizeRef?.current?.validate) {
      return customizeRef.current.validate();
    }
    return true;
  }, [customizeRef]);

  // 保底快捷入口：把当前商品写入购物车缓存并跳结算页（已应用折扣码经 localStorage 自动带过去）。
  // PayPal 不可用地区仍能一键进入下单流程，是「让用户快速购买」的兜底路径。
  const router = useRouter();
  const handleCheckout = React.useCallback(() => {
    if (!validateCustomize()) return;
    const customizeData = customizeRef?.current?.getData
      ? customizeRef.current.getData()
      : [];
    const line = {
      sortKey: productInfo.sort_key,
      productKey: productInfo.key,
      comboKey: productCurCombo.key,
      productNum,
      options: cartOptions,
      customize_data: customizeData
    };
    // 立即购买语义：结算页只结算当前商品，故直接以单行覆盖购物车缓存。
    window.localStorage.setItem("store_shopping", JSON.stringify([line]));
    tracking.enterOrderForm?.({
      currency: productCurCombo.areaInfo?.currency,
      value: orderPricing.pay_price,
      contents: [line]
    });
    onClose?.();
    router.push(`/${locale}/order`);
  }, [
    validateCustomize,
    customizeRef,
    productInfo,
    productCurCombo,
    productNum,
    cartOptions,
    orderPricing,
    locale,
    onClose,
    router
  ]);

  if (!mounted) return null;

  return ReactDOM.createPortal(
    <div
      className={styles.mask}
      data-show={open}
      onClick={onClose}
    >
      <div
        className={styles.drawer}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.header}>
          <div className={styles.title}>
            {LANG["store.product.buy_now"] || "Buy Now"}
          </div>
          <div className={styles.close} onClick={onClose}>
            ×
          </div>
        </div>

        <div className={styles.body}>
          {/* 当前产品数量清单 */}
          <div className={styles.line_item}>
            <div className={styles.line_img}>
              {orderList[0].image ? (
                <img alt={orderList[0].name} src={orderList[0].image} />
              ) : null}
            </div>
            <div className={styles.line_info}>
              <div className={styles.line_name}>{orderList[0].name}</div>
              {productCurCombo.title ? (
                <div className={styles.line_combo}>{productCurCombo.title}</div>
              ) : null}
              {cartOptions?.length ? (
                <div className={styles.line_options}>
                  {cartOptions
                    .filter((o) => o.value)
                    .map((o, i) => (
                      <div key={i}>{`${o.name}: ${o.value}`}</div>
                    ))}
                </div>
              ) : null}
              <div className={styles.line_qty}>{`× ${productNum}`}</div>
            </div>
            <div className={styles.line_price}>
              {`${symbol}${formatCurrency(
                (productCurCombo.areaInfo?.product_price || 0) * productNum,
                unit
              )}`}
            </div>
          </div>

          {/* 折扣码入口：产品码 / 订单码统一填写 */}
          <div className={styles.promo}>
            <div className={styles.promo_label}>
              {LANG["store.product.buy_now_promo_label"] ||
                "Discount codes (product / order)"}
            </div>
            <div className={styles.promo_row}>
              <input
                type="text"
                className={styles.promo_input}
                value={discountCodeInput}
                placeholder={
                  LANG["store.order.discount_code_placeholder"] || "Promo code"
                }
                onChange={(e) => setDiscountCodeInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleApply();
                  }
                }}
              />
              <button
                type="button"
                className={styles.promo_btn}
                disabled={previewLoading || !discountCodeInput.trim()}
                onClick={handleApply}
              >
                {LANG["store.order.discount_code_apply"] || "Apply"}
              </button>
            </div>
            {discountCodes.length ? (
              <div className={styles.promo_tags}>
                {discountCodes.map((code) => (
                  <div key={code} className={styles.promo_tag}>
                    <span>{code}</span>
                    <button
                      type="button"
                      aria-label={
                        LANG["store.order.discount_code_remove"] || "Remove"
                      }
                      onClick={() => handleRemove(code)}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            ) : null}
            {previewError && !previewLoading ? (
              <div className={styles.promo_error}>{previewError}</div>
            ) : null}
            {rejectionNotice && !previewLoading ? (
              <div className={styles.promo_error}>{rejectionNotice}</div>
            ) : null}
          </div>

          {/* 价格明细 */}
          <div className={styles.summary}>
            <div className={styles.summary_row}>
              <span>{LANG["common.cart.subtotal"] || "Subtotal"}</span>
              <span>{`${symbol}${formatCurrency(subtotalPrice, unit)}`}</span>
            </div>
            {orderPricing.discount > 0 ? (
              <div className={styles.summary_row}>
                <span>
                  {LANG["store.order.discount_amount"] || "Discount"}
                </span>
                <span className={styles.summary_discount}>
                  {`-${symbol}${formatCurrency(orderPricing.discount, unit)}`}
                </span>
              </div>
            ) : null}
            <div className={`${styles.summary_row} ${styles.summary_total}`}>
              <span>{LANG["store.order.total"] || "Total"}</span>
              <span>{`${symbol}${formatCurrency(
                orderPricing.pay_price,
                unit
              )}`}</span>
            </div>
          </div>
        </div>

        {/* 快捷支付 */}
        <div className={styles.footer}>
          {paypalEnabled ? (
            previewLoading ? (
              <Loading height={108} />
            ) : (
              <div className={styles.paypal_box}>
                <PayPalScriptProvider
                  options={{
                    clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID,
                    components: "buttons",
                    currency,
                    locale: `${
                      locale === "zh-cn" || locale === "zh-hk" ? "zh" : locale
                    }_${countryCode}`
                  }}
                >
                  <DrawerPayButton
                    LANG={LANG}
                    CONFIG={CONFIG}
                    locale={locale}
                    area={area}
                    orderList={orderList}
                    orderPricing={orderPricing}
                    discountCodes={discountCodes}
                    customizeRef={customizeRef}
                    onValidate={validateCustomize}
                  />
                </PayPalScriptProvider>
              </div>
            )
          ) : null}
          {/* 保底快捷入口：直达结算页（PayPal 不可用地区的唯一快捷购买路径，
              PayPal 可用时作为「更多支付方式」的补充入口）。 */}
          <div className={styles.checkout_btn} onClick={handleCheckout}>
            {paypalEnabled
              ? LANG["store.product.buy_now_more_pay"] || "More payment options"
              : LANG["common.cart.checkout"] || "Checkout"}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
