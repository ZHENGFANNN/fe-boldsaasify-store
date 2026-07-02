/** @format */

"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";

import resolveCartFromApi from "@/components/Layout/cartClient";
import PayList from "../PayList";
import UserInfo from "../UserType";
import Api from "../../api";
import tracking from "../../tracking";
import OrderContext from "../../context";
import AddressList from "../AddressList";
import AddressForm from "../AddressForm";
import NewAddressForm from "../NewAddressForm";
import { domesticPay, foreignPay, isPayAreaSupported } from "../../const";
import Paypal from "../Paypal";
import StripePay from "../StripePay";

import ShowTipModal from "@/components/Modal/ShowTipModal";
import Loading from "@/components/Loading";
import Advantage from "@/components/Layout/Advantage";
import { formatCurrency, roundToDecimalPlaces } from "@/utils";

import styles from "./index.module.scss";
import Cookies from "js-cookie";
import {
  readStoredDiscountCodes,
  writeStoredDiscountCodes,
} from "@/utils/discount-codes";

function parsePreviewAmount(value) {
  if (typeof value === "number") return value;
  return parseFloat(value) || 0;
}

export default function Main({ CONFIG, LANG, area, token }) {
  const router = useRouter();
  const { locale } = useParams();
  const [userInfo, setUserInfo] = React.useState();
  const [orderLoading, setOrderLoading] = React.useState(false);
  // 订单备注
  const textareaRef = React.useRef();
  // 用户方式
  const userRef = React.useRef();
  // 信用卡
  const payRef = React.useRef();
  // 游客 - 地址表单
  const addressRef = React.useRef(null);
  /**
   * 数据相关
   */
  // 用户类型
  const [userType, setUserType] = React.useState("tourists");
  const [userLoading, setUserLoading] = React.useState(false);
  // 用地址
  const [addressInfo, setAddressInfo] = React.useState();
  // 地址列表
  const [addressList, setAddressList] = React.useState([]);
  const [addressLoading, setAddressLoading] = React.useState(false);
  const getAddressList = React.useCallback(() => {
    if (token) {
      setAddressLoading(true);
      Api.getUserAddress()
        .then((res) => {
          if (res.code !== 0) throw new Error("code!==0");
          setAddressList(
            res.data.list.filter((item) => item.area_code === area)
          );
          setAddressLoading(false);
        })
        .catch(() => {
          setAddressLoading(false);
        });
    }
  }, []);

  React.useEffect(() => {
    // 获取地址列表
    getAddressList();
  }, []);
  // 弹出框
  const tipRef = React.useRef();
  const showTip = React.useCallback(({ text, type }) => {
    tipRef.current.show({ text, type });
  }, []);
  // PayPal 是否对当前地区开放（来自 config_global_settings 的 setting.pay）
  const paypalEnabled = React.useMemo(() => {
    const paypal = CONFIG["setting.pay"]?.paypal;
    return (
      paypal?.enabled === true &&
      isPayAreaSupported(paypal?.supportArea, area)
    );
  }, [CONFIG, area]);

  const stripeEnabled = React.useMemo(() => {
    const stripe = CONFIG["setting.pay"]?.stripe;
    return (
      stripe?.enabled === true &&
      isPayAreaSupported(stripe?.supportArea, area)
    );
  }, [CONFIG, area]);

  // 选中支付方式
  const [payKey, setPayKey] = React.useState();
  const payWayList = React.useMemo(() => {
    const base =
      locale === "zh-cn"
        ? domesticPay({ CONFIG, LANG })
        : foreignPay({ CONFIG, LANG });
    // PayPal / Stripe 受 setting.pay 门控
    return base.filter((item) => {
      if (item.key === "payPal") return paypalEnabled;
      if (item.key === "stripe") return stripeEnabled;
      return true;
    });
  }, [locale, paypalEnabled, stripeEnabled, CONFIG, LANG]);

  React.useEffect(() => {
    if (!payWayList.length) return;
    setPayKey((prev) => {
      if (prev && payWayList.some((item) => item.key === prev)) return prev;
      return payWayList[0]?.key;
    });
  }, [payWayList]);

  // 设置销售政策
  React.useEffect(() => {
    const $dom = document.getElementsByClassName(styles.sales_content)[0];
    const $aTags = $dom.getElementsByTagName("a")[0];
    $aTags?.setAttribute("href", `/article/legal/sales-policy`);
    $aTags?.setAttribute("target", "_blank");
  }, []);

  // 订单列表
  const [orderList, setOrderList] = React.useState([]);
  React.useEffect(() => {
    // 获取购物车列表（价格随 area 实时，走 /api/cart）
    let cancelled = false;
    (async () => {
      const rows = await resolveCartFromApi({ area, language: locale });
      if (cancelled) return;
      const list = rows.map((row) => ({
        // 套餐相关
        id: row.id,
        comboName: row.comboName,
        // 地区相关
        priceSymbol: row.areaInfo.currency_symbol,
        priceCurrency: row.areaInfo.currency,
        priceUnit: row.areaInfo.currency_unit,
        productPrice: row.areaInfo.product_price,
        sellingPrice: row.areaInfo.selling_price,
        productDiscount: row.areaInfo.product_discount,
        stock: row.areaInfo.stock,
        // 产品相关
        name: row.name,
        image: row.image,
        href: `/${locale}/product/${row.sortKey}/${row.productKey}`,
        sortKey: row.sortKey,
        productKey: row.productKey,
        comboKey: row.comboKey,
        // 其他
        productNum: row.productNum,
        options: row.options,
        // 定制字段（随每个购物车行带入 order_list，最终提交 createOrder）
        customize_data: Array.isArray(row.customize_data)
          ? row.customize_data
          : [],
      }));
      if (list.length === 0) {
        location.href = `/${locale}`;
        return;
      }
      setOrderList(list);
    })();
    return () => {
      cancelled = true;
    };
  }, [payKey, area, locale]);

  // 商品小计（标价 product_price，仅作 preview 未返回时的兜底）
  const subtotalPrice = React.useMemo(() => {
    return orderList.reduce((pre, cur) => {
      return pre + cur.productPrice * cur.productNum;
    }, 0);
  }, [orderList]);

  const [discountCodeInput, setDiscountCodeInput] = React.useState("");
  const [discountCodes, setDiscountCodes] = React.useState(() =>
    readStoredDiscountCodes()
  );
  const [previewLoading, setPreviewLoading] = React.useState(false);
  const [previewData, setPreviewData] = React.useState(null);
  const [previewError, setPreviewError] = React.useState(null);
  const [previewRegion, setPreviewRegion] = React.useState("");

  React.useEffect(() => {
    if (addressInfo?.state) {
      setPreviewRegion(addressInfo.state);
    }
  }, [addressInfo]);

  const fetchOrderPreview = React.useCallback(
    async (codes, region) => {
      if (!orderList.length) return null;
      setPreviewLoading(true);
      try {
        const payload = {
          area_code: area,
          discount_codes: codes,
          include_automatic: true,
          order_list: orderList,
        };
        if (region) {
          payload.shipping_address = { country: area, state: region };
        }
        const res = await Api.previewOrder(payload);
        if (res.code !== 0) {
          const message =
            typeof res.data === "string"
              ? res.data
              : LANG["store.order.discount_code_invalid"] ||
                "Invalid discount code";
          throw new Error(message);
        }
        const data = {
          total_price: parsePreviewAmount(res.data.total_price),
          shipping_fee: parsePreviewAmount(res.data.shipping_fee),
          shipping_discount: parsePreviewAmount(res.data.shipping_discount),
          shipping_pay: parsePreviewAmount(res.data.shipping_pay),
          discount: parsePreviewAmount(res.data.discount),
          pay_price: parsePreviewAmount(res.data.pay_price),
          discount_breakdown: res.data.discount_breakdown,
          applied_rules: res.data.applied_rules || [],
          preview_token: res.data.preview_token,
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
    [orderList, area, LANG]
  );

  React.useEffect(() => {
    if (!orderList.length) return;
    fetchOrderPreview(discountCodes, previewRegion).catch(() => {});
  }, [orderList, discountCodes, previewRegion, fetchOrderPreview]);

  const priceUnit = orderList[0]?.priceUnit;
  const priceSymbol = orderList[0]?.priceSymbol;

  const orderPricing = React.useMemo(() => {
    const total_price = previewData?.total_price ?? subtotalPrice;
    const shipping_fee = previewData?.shipping_fee ?? 0;
    const shipping_pay = previewData?.shipping_pay ?? 0;
    const shipping_discount = previewData?.shipping_discount ?? 0;
    const discount = previewData?.discount ?? 0;
    const pay_price =
      previewData?.pay_price ?? roundToDecimalPlaces(subtotalPrice + shipping_pay, priceUnit);
    return {
      total_price: roundToDecimalPlaces(total_price, priceUnit),
      shipping_fee: roundToDecimalPlaces(shipping_fee, priceUnit),
      shipping_pay: roundToDecimalPlaces(shipping_pay, priceUnit),
      shipping_discount: roundToDecimalPlaces(shipping_discount, priceUnit),
      discount: roundToDecimalPlaces(discount, priceUnit),
      pay_price: roundToDecimalPlaces(pay_price, priceUnit),
      preview_token: previewData?.preview_token,
    };
  }, [previewData, subtotalPrice, priceUnit]);

  const buildCreateOrderPayload = React.useCallback(
    (userInfo) => {
      const payload = {
        ...userInfo,
        pay_key: payKey,
        total_price: orderPricing.total_price,
        shipping_fee: orderPricing.shipping_fee,
        discount: orderPricing.discount,
        pay_price: orderPricing.pay_price,
        order_list: orderList,
      };
      if (discountCodes.length) {
        payload.discount_codes = discountCodes;
      }
      if (orderPricing.preview_token) {
        payload.preview_token = orderPricing.preview_token;
      }
      payload.pricing_area_code = area;
      return payload;
    },
    [payKey, orderPricing, orderList, discountCodes, area]
  );

  const handleApplyDiscountCode = React.useCallback(async () => {
    const code = discountCodeInput.trim().toUpperCase();
    if (!code) return;
    if (discountCodes.includes(code)) {
      showTip({
        text:
          LANG["store.order.discount_code_applied"] ||
          "Discount code already applied",
        type: "info",
      });
      return;
    }
    try {
      await fetchOrderPreview([...discountCodes, code], previewRegion);
      setDiscountCodes((prev) => {
        const next = [...prev, code];
        writeStoredDiscountCodes(next);
        return next;
      });
      setDiscountCodeInput("");
    } catch (err) {
      showTip({
        text: err?.message || LANG["store.order.discount_code_invalid"],
        type: "error",
      });
    }
  }, [discountCodeInput, discountCodes, fetchOrderPreview, showTip, LANG]);

  const handleRemoveDiscountCode = React.useCallback(
    (code) => {
      setDiscountCodes((prev) => {
        const next = prev.filter((item) => item !== code);
        writeStoredDiscountCodes(next);
        return next;
      });
    },
    []
  );

  // 获取用户信息
  React.useEffect(() => {
    if (token) {
      setUserLoading(true);
      Api.tokenLogin()
        .then((res) => {
          if (res.code === 0) {
            setUserInfo(res.data);
            setUserType("user");
          } else {
            throw new Error("code !== 0");
          }
        })
        .catch(() => {
          Cookies.remove("token");
          setUserType("tourists");
        })
        .finally(() => {
          setUserLoading(false);
        });
    } else {
      setUserType("tourists");
    }
  }, []);

  const getUserInfo = React.useCallback(() => {
    const user_remark = textareaRef.current.value;
    let addressForm, emailForm;
    // 用户登录 - 获取地址
    if (userType === "user") {
      addressForm = addressInfo;
    }
    // 获取用户邮箱
    emailForm = userRef.current?.onSubmit();
    // 记录访客登录状态 - 获取地址
    if (userType === "tourists") {
      addressForm = addressRef.current?.onSubmit();
      if (emailForm?.email)
        localStorage.setItem("tourists_email", emailForm?.email);
      if (addressForm)
        localStorage.setItem("address_form", JSON.stringify(addressForm));
    }

    if (!emailForm || !addressForm) {
      showTip({
        text: LANG["common.pay.pay_info.basic_info_tip"],
        type: "info",
      });
      return null;
    }

    return {
      ...addressForm,
      ...emailForm,
      user_remark,
    };
  }, [addressInfo, userType]);

  // Paypal特殊处理
  const [payPalLoading, setPayPalLoading] = React.useState(false);
  React.useEffect(() => {
    setPayPalLoading(false);
    setTimeout(() => {
      setPayPalLoading(true);
    }, 400);
  }, [userType, addressInfo]);

  const [stripeClientSecret, setStripeClientSecret] = React.useState(null);
  const [stripeOrderSecret, setStripeOrderSecret] = React.useState(null);
  const [stripeLoading, setStripeLoading] = React.useState(false);

  React.useEffect(() => {
    setStripeClientSecret(null);
    setStripeOrderSecret(null);
  }, [payKey, userType, addressInfo]);

  // 清空购物车
  const clearOrderList = React.useCallback(() => {
    // 获取购物车列表
    window.localStorage.removeItem("store_shopping");
    // 清空购物车 Drawer 持久化的折扣码，防止下次进购物车残留旧码（已用过的码再次提交会被后端拒）
    writeStoredDiscountCodes([]);
  }, []);

  // 埋点
  const trackingInitiateCheckout = React.useCallback(() => {
    tracking.initiateCheckout({
      from: "order_page",
      currency: orderList[0].priceCurrency,
      value: orderPricing.pay_price,
      discount: orderPricing.discount,
      type: payKey === "stripe" ? "stripe" : "payPal",
      contents: orderList,
    });
  }, [orderList, orderPricing, payKey]);

  const handleStripePrepare = React.useCallback(async () => {
    if (orderLoading || previewLoading || stripeLoading) return;
    const userInfo = getUserInfo();
    if (!userInfo) return;

    setStripeLoading(true);
    try {
      const res = await Api.createOrder(buildCreateOrderPayload(userInfo));
      if (res.code === 0 && res.data?.client_secret) {
        setStripeClientSecret(res.data.client_secret);
        setStripeOrderSecret(res.data.secret);
        secret.current = res.data.secret;
        trackingInitiateCheckout();
        localStorage.setItem(
          "order",
          JSON.stringify({
            secret: res.data.secret,
            time: Date.now(),
          })
        );
      } else {
        throw new Error("missing client_secret");
      }
    } catch {
      showTip({
        text: LANG["common.pay.pay_button.create_error"],
        type: "error",
      });
    } finally {
      setStripeLoading(false);
    }
  }, [
    orderLoading,
    previewLoading,
    stripeLoading,
    getUserInfo,
    buildCreateOrderPayload,
    trackingInitiateCheckout,
    showTip,
    LANG,
  ]);

  const stripeReturnUrl = React.useMemo(() => {
    if (typeof window === "undefined") {
      return `${process.env.NEXT_PUBLIC_DOMAIN}/${locale}/order/info?secret=${stripeOrderSecret || ""}`;
    }
    return `${window.location.origin}/${locale}/order/info?secret=${stripeOrderSecret || ""}`;
  }, [locale, stripeOrderSecret]);

  const secret = React.useRef();

  return (
    <OrderContext.Provider
      value={{
        userLoading,
        userInfo,
        userType,
        setUserType,
      }}
    >
      <div className={styles.container}>
        <h1>{LANG["store.order.confirm_order"]}</h1>
        <div className={styles.content_container}>
          <div className={styles.submit_container}>
            <div className={styles.user_container}>
              <UserInfo LANG={LANG} token={token} ref={userRef} />
            </div>

            <div className={`${styles.address_container}`}>
              {!userInfo?.email && userType === "user" ? (
                <>
                  {!token ? (
                    <div className={styles.mask}>
                      <div
                        className={styles.btn}
                        onClick={() => {
                          location.href = `/user/login?redirect=${location.href}`;
                        }}
                      >
                        {LANG["store.order.please_login"]}
                      </div>
                    </div>
                  ) : null}
                </>
              ) : null}
              <div className={styles.address_header}>
                <h2>{LANG["common.pay.pay_info.shipping_address"]}</h2>
                {userType === "user" ? (
                  <NewAddressForm
                    LANG={LANG}
                    onFinish={() => getAddressList()}
                  />
                ) : null}
              </div>
              {addressLoading ? (
                <Loading height={400} />
              ) : (
                <>
                  {userType === "user" ? (
                    <AddressList
                      LANG={LANG}
                      setAddressInfo={setAddressInfo}
                      list={addressList}
                      showTip={({ text, type }) => {
                        showTip({ text, type });
                      }}
                    />
                  ) : (
                    <AddressForm
                      LANG={LANG}
                      ref={addressRef}
                      onStateChange={setPreviewRegion}
                    />
                  )}
                </>
              )}
            </div>

            <div className={styles.pay_container}>
              <div className={styles.address_header}>
                <h2>{LANG["common.pay.pay_info.pay_method_title"]}</h2>
              </div>
              <PayList
                ref={payRef}
                LANG={LANG}
                setPayKey={setPayKey}
                payKey={payKey}
                payWayList={payWayList}
              />
            </div>

            <div className={styles.order_remark}>
              <h2>{LANG["common.pay.pay_info.order_remark"]}</h2>
              <div className={styles.textarea_input}>
                <textarea
                  maxLength={500}
                  ref={textareaRef}
                  placeholder={LANG["common.pay.pay_info.order_remark_placeholder"]}
                />
              </div>
            </div>
          </div>
          <div className={styles.order_container}>
            <h2>{LANG["store.order.order_info"]}</h2>
            {subtotalPrice ? (
              <>
                <div className={styles.order_list}>
                  {orderList.map((item, index) => {
                    return (
                      <div key={index} className={styles.order_items}>
                        <div className={styles.order_items_img_container}>
                          <div className={styles.order_items_img}>
                            <img alt={item.name} src={item.image} />
                          </div>
                        </div>

                        <div className={styles.order_items_content}>
                          <h3>{item.name}</h3>
                          <div className={styles.item_combo}>
                            {item.comboName}
                          </div>
                          <div className={styles.item_option}>
                            {item.options.map((option, index) => {
                              return (
                                <div
                                  key={index}
                                >{`${option.name}: ${option.value}`}</div>
                              );
                            })}
                          </div>
                          <div className={styles.item_num}>
                            <span>×</span> {item.productNum}
                          </div>
                        </div>
                        <div className={styles.order_price}>
                          <div>{`${item.priceSymbol}${formatCurrency(
                            item.productPrice * item.productNum,
                            item.priceUnit
                          )}`}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className={styles.discount_code_container}>
                  <h3>
                    {LANG["store.order.discount_code"] || "Discount code"}
                  </h3>
                  <div className={styles.discount_code_input_row}>
                    <input
                      type="text"
                      value={discountCodeInput}
                      placeholder={
                        LANG["store.order.discount_code_placeholder"] ||
                        "Enter code"
                      }
                      onChange={(e) => setDiscountCodeInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleApplyDiscountCode();
                        }
                      }}
                    />
                    <button
                      type="button"
                      className={styles.discount_code_apply_btn}
                      disabled={previewLoading || !discountCodeInput.trim()}
                      onClick={handleApplyDiscountCode}
                    >
                      {LANG["store.order.discount_code_apply"] || "Apply"}
                    </button>
                  </div>
                  {discountCodes.length ? (
                    <div className={styles.discount_code_tags}>
                      {discountCodes.map((code) => (
                        <div key={code} className={styles.discount_code_tag}>
                          <span>{code}</span>
                          <button
                            type="button"
                            aria-label={
                              LANG["store.order.discount_code_remove"] ||
                              "Remove"
                            }
                            onClick={() => handleRemoveDiscountCode(code)}
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : null}
                  {previewError && !previewLoading ? (
                    <div className={styles.discount_code_error}>
                      {previewError}
                    </div>
                  ) : null}
                </div>
                <div className={styles.price_list}>
                  <div className={styles.price_item}>
                    <h3>{LANG["store.order.good_total"]}</h3>
                    <span>{`${priceSymbol}${formatCurrency(
                      orderPricing.total_price,
                      priceUnit
                    )}`}</span>
                  </div>
                  {previewData?.applied_rules?.filter(
                    (r) => !String(r.type || "").includes("shipping")
                  ).length ? (
                    <div className={styles.applied_rules_list}>
                      {previewData.applied_rules
                        .filter(
                          (r) => !String(r.type || "").includes("shipping")
                        )
                        .map((rule) => (
                          <div
                            key={`${rule.rule_id}-${rule.code || rule.method}`}
                            className={styles.price_item}
                          >
                            <h3>
                              {rule.code ||
                                rule.title ||
                                (rule.method === "automatic"
                                  ? LANG["store.order.automatic_discount"] ||
                                    "Promotion"
                                  : LANG["store.order.discount_amount"] ||
                                    "Discount")}
                            </h3>
                            <span className={styles.discount_value}>{`-${priceSymbol}${formatCurrency(
                              parsePreviewAmount(rule.amount),
                              priceUnit
                            )}`}</span>
                          </div>
                        ))}
                    </div>
                  ) : orderPricing.discount > 0 ? (
                    <div className={styles.price_item}>
                      <h3>
                        {LANG["store.order.discount_amount"] || "Discount"}
                      </h3>
                      <span className={styles.discount_value}>{`-${priceSymbol}${formatCurrency(
                        orderPricing.discount,
                        priceUnit
                      )}`}</span>
                    </div>
                  ) : null}
                  <div className={styles.price_item}>
                    <h3>{LANG["store.order.express_price"]}</h3>
                    <span>
                      {previewLoading ? (
                        "..."
                      ) : orderPricing.shipping_pay > 0 ? (
                        `${priceSymbol}${formatCurrency(
                          orderPricing.shipping_pay,
                          priceUnit
                        )}`
                      ) : (
                        LANG["store.order.express_free"]
                      )}
                    </span>
                  </div>
                  {orderPricing.shipping_discount > 0 ? (
                    <div className={styles.price_item}>
                      <h3>
                        {LANG["store.order.shipping_discount"] ||
                          "Shipping discount"}
                      </h3>
                      <span className={styles.discount_value}>{`-${priceSymbol}${formatCurrency(
                        orderPricing.shipping_discount,
                        priceUnit
                      )}`}</span>
                    </div>
                  ) : null}
                  <div className={styles.price_item}>
                    <h3>{LANG["store.order.tax"]}</h3>
                    <span>{LANG["store.order.tax_include"]}</span>
                  </div>
                </div>
                <div className={styles.price_total}>
                  <h3>{LANG["store.order.total_price"]}</h3>
                  <span>
                    {previewLoading ? (
                      <span className={styles.preview_loading}>...</span>
                    ) : (
                      `${priceSymbol}${formatCurrency(
                        orderPricing.pay_price,
                        priceUnit
                      )}`
                    )}
                  </span>
                </div>
              </>
            ) : (
              <Loading height={300} />
            )}
            <div
              className={styles.sales_content}
              dangerouslySetInnerHTML={{
                __html:
                  LANG["store.order.order_policy"]
                    ?.split("${1}")
                    .join(CONFIG["common.base"]?.company_name || "") || "",
              }}
            />
            {/* 银行支付方式 */}
            {payKey === "bank" || payKey === "cod" ? (
              <div
                className={styles.submit_btn}
                onClick={async () => {
                  if (orderLoading || previewLoading) return;
                  const userInfo = getUserInfo();
                  if (!userInfo) return;
                  // 处理订单
                  try {
                    setOrderLoading(true);
                    const res = await Api.createOrder(
                      buildCreateOrderPayload(userInfo)
                    );
                    if (res.code === 0) {
                      trackingInitiateCheckout();
                      showTip({
                        text: LANG["store.order.create_success"],
                        type: "success",
                      });
                      // 保存订单号
                      localStorage.setItem(
                        "order",
                        JSON.stringify({
                          secret: res.data.secret,
                          time: Date.now(),
                        })
                      );
                      setTimeout(() => {
                        clearOrderList();
                        router.push(`/order/info?secret=${res.data.secret}`);
                      }, 1000);
                    } else {
                      throw new Error("code !== 0");
                    }
                  } catch (error) {
                    setOrderLoading(false);
                    showTip({
                      text: LANG["common.pay.pay_button.create_error"],
                      type: "error",
                    });
                  }
                }}
              >
                {LANG["store.order.submit_order"]}
              </div>
            ) : null}
            {/* Paypal支付方式 */}
            {payKey === "payPal" && orderList[0]?.priceCurrency ? (
              <>
                {!payPalLoading ? (
                  <Loading height={108} />
                ) : (
                  <div className={styles.paypal_btn}>
                    <Paypal
                      CONFIG={CONFIG}
                      LANG={LANG}
                      locale={locale}
                      area={area}
                      currency={orderList[0]?.priceCurrency}
                      onError={(error) => {
                        console.log("[Order Page Paypal Error]: ", error);
                        // 前置校验失败 / 建单失败已各自提示过，静默处理避免二次报错
                        if (error?.silent || (userType === "user" && !addressInfo)) {
                          return;
                        } else {
                          showTip({
                            text: LANG["common.pay.pay_button.pay_error"],
                            type: "error",
                          });
                        }
                      }}
                      onCancel={(data) => {
                        if (data.orderID) {
                          showTip({
                            text: LANG["common.pay.pay_button.pay_cancel"],
                            type: "error",
                          });
                          setTimeout(() => {
                            clearOrderList();
                            location.href = `/order/info?secret=${secret.current}`;
                          }, 1000);
                        }
                      }}
                      createOrder={() => {
                        // createOrder 必须返回 order id 或 reject；返回 undefined 会触发
                        // PayPal "Expected an order id to be passed"
                        if (previewLoading) {
                          return Promise.reject(
                            Object.assign(new Error("preview loading"), {
                              silent: true,
                            })
                          );
                        }
                        const userInfo = getUserInfo();
                        if (!userInfo) {
                          // getUserInfo 已弹基础资料提示，静默 reject 即可
                          return Promise.reject(
                            Object.assign(new Error("invalid user info"), {
                              silent: true,
                            })
                          );
                        }
                        return Api.createOrder(buildCreateOrderPayload(userInfo))
                          .then((res) => {
                            if (res.code === 0) {
                              secret.current = res.data.secret;
                              trackingInitiateCheckout();
                              // 保存订单号
                              localStorage.setItem(
                                "order",
                                JSON.stringify({
                                  secret: res.data.secret,
                                  time: Date.now(),
                                })
                              );
                              return res.data.id;
                            } else {
                              throw new Error("code !== 0");
                            }
                          })
                          .catch((err) => {
                            showTip({
                              text: LANG["common.pay.pay_button.create_error"],
                              type: "error",
                            });
                            // 已提示，标记静默后 reject —— 满足 PayPal 合约且避免 onError 二次报错
                            err.silent = true;
                            throw err;
                          });
                      }}
                      onApprove={(data) => {
                        return Api.confirmPaypal({
                          id: data.orderID,
                          from: "order_page",
                        })
                          .then((res) => {
                            if (res.code === 0) {
                              tracking.purchase({
                                from: "order_page",
                                currency: res.data.currency_code,
                                value: res.data.value,
                                discount: orderPricing.discount,
                                type: "payPal",
                                contents: orderList,
                              });
                              showTip({
                                text: LANG["common.pay.pay_button.pay_success"],
                                type: "success",
                              });
                              // 移除订单信息
                              localStorage.removeItem("order");
                              setTimeout(() => {
                                clearOrderList();
                                location.href = `/order/info?secret=${res.data.secret}`;
                              }, 1000);
                            } else {
                              throw new Error("code !== 0");
                            }
                          })
                          .catch(() => {
                            showTip({
                              text: LANG["common.pay.pay_button.pay_fail_tip"],
                              type: "error",
                            });
                          });
                      }}
                    />
                  </div>
                )}
              </>
            ) : null}
            {/* Stripe 支付方式 */}
            {payKey === "stripe" && stripeEnabled && orderList[0]?.priceCurrency ? (
              <div className={styles.stripe_btn}>
                {!stripeClientSecret ? (
                  <div
                    className={styles.submit_btn}
                    onClick={handleStripePrepare}
                  >
                    {stripeLoading
                      ? "..."
                      : LANG["store.order.submit_order"]}
                  </div>
                ) : (
                  <StripePay
                    clientSecret={stripeClientSecret}
                    locale={locale}
                    LANG={LANG}
                    returnUrl={stripeReturnUrl}
                    onError={() => {
                      showTip({
                        text: LANG["common.pay.pay_button.pay_error"],
                        type: "error",
                      });
                    }}
                    onSuccess={() => {
                      tracking.purchase({
                        from: "order_page",
                        currency: orderList[0].priceCurrency,
                        value: orderPricing.pay_price,
                        discount: orderPricing.discount,
                        type: "stripe",
                        contents: orderList,
                      });
                      showTip({
                        text: LANG["common.pay.pay_button.pay_success"],
                        type: "success",
                      });
                      localStorage.removeItem("order");
                      setTimeout(() => {
                        clearOrderList();
                        router.push(`/order/info?secret=${stripeOrderSecret}`);
                      }, 1000);
                    }}
                  />
                )}
              </div>
            ) : null}
          </div>
        </div>
        <Advantage LANG={LANG} />
        <ShowTipModal ref={tipRef} />
      </div>
    </OrderContext.Provider>
  );
}
