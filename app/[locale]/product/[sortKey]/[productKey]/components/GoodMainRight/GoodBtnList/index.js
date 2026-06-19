/** @format */

"use client";

import {
  PayPalScriptProvider,
  PayPalButtons,
  usePayPalScriptReducer
} from "@paypal/react-paypal-js";
import styles from "./index.module.scss";
import React from "react";
import Loading from "@/components/Loading";
import ShowTipModal from "@/components/Modal/ShowTipModal";

import { useRouter } from "next/navigation";

import ProductContext from "../../../ProductContext";
import tracking from "../../../tracking";
import Api from "../../../api";
import GlobalContext from "@/[locale]/context";

import { roundToDecimalPlaces } from "@/utils";
import { readClientArea } from "@/utils/readClientArea";

function parsePreviewAmount(value) {
  if (typeof value === "number") return value;
  return parseFloat(value) || 0;
}

function PayButton({
  productInfo,
  productCurCombo,
  productOptions,
  productNum,
  locale,
  LANG,
  CONFIG,
  currency,
  area,
  customizeRef
}) {
  const [
    { isPending, isRejected, options },
    dispatch
  ] = usePayPalScriptReducer();
  const router = useRouter();
  const tipRef = React.useRef(null);
  const secret = React.useRef();
  const showTip = React.useCallback(({ text, type }) => {
    tipRef.current.show({ text, type });
  }, []);

  const subtotalPrice = React.useMemo(() => {
    return roundToDecimalPlaces(
      productCurCombo.areaInfo.product_price * productNum,
      productCurCombo.areaInfo.currency_unit
    );
  }, [productCurCombo, productNum]);

  const orderList = React.useMemo(() => {
    return [
      {
        id: productCurCombo.id,
        comboName: productCurCombo.title,
        priceSymbol: productCurCombo.areaInfo.currency_symbol,
        priceCurrency: productCurCombo.areaInfo.currency,
        priceUnit: productCurCombo.areaInfo.currency_unit,
        productPrice: productCurCombo.areaInfo.product_price,
        sellingPrice: productCurCombo.areaInfo.selling_price,
        productDiscount: productCurCombo.areaInfo.product_discount || 0,
        stock: productCurCombo.areaInfo.stock,
        name: productInfo.name,
        image: Array.isArray(productInfo.image_list)
          ? productInfo.image_list[0]?.src
          : undefined,
        href: `/${locale}/product/${productInfo.sort_key}/${productInfo.key}`,
        sortKey: productInfo.sort_key,
        productKey: productInfo.key,
        comboKey: productCurCombo.key,
        productNum,
        options: productOptions,
        customize_data: customizeRef?.current?.getData
          ? customizeRef.current.getData()
          : []
      }
    ];
  }, [productNum, productCurCombo, productInfo, productOptions, locale]);

  const [previewData, setPreviewData] = React.useState(null);
  const [previewLoading, setPreviewLoading] = React.useState(false);

  React.useEffect(() => {
    if (!orderList.length || !area) return;
    let cancelled = false;
    setPreviewLoading(true);
    Api.previewOrder({
      area_code: area,
      include_automatic: true,
      discount_codes: [],
      order_list: orderList
    })
      .then((res) => {
        if (cancelled) return;
        if (res.code !== 0) throw new Error("preview failed");
        setPreviewData({
          total_price: parsePreviewAmount(res.data.total_price),
          shipping_fee: parsePreviewAmount(res.data.shipping_fee),
          discount: parsePreviewAmount(res.data.discount),
          pay_price: parsePreviewAmount(res.data.pay_price)
        });
      })
      .catch(() => {
        if (!cancelled) setPreviewData(null);
      })
      .finally(() => {
        if (!cancelled) setPreviewLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [orderList, area]);

  const orderPricing = React.useMemo(() => {
    const unit = productCurCombo.areaInfo.currency_unit;
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
  }, [previewData, subtotalPrice, productCurCombo]);

  const trackingInitiateCheckout = React.useCallback(() => {
    tracking.initiateCheckout({
      currency: orderList[0].priceCurrency,
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
  } else {
    return (
      <>
        {isPending || previewLoading ? (
          <Loading height={108} />
        ) : (
          <PayPalButtons
            style={{
              layout: "vertical",
              color: "gold",
              label: "paypal"
            }}
            forceReRender={[
              productNum,
              productCurCombo,
              productInfo,
              locale,
              orderPricing.pay_price,
              currency
            ]}
            createOrder={async () => {
              // 定制字段必填校验：未通过则内联报错并阻断下单（PayPal 合约需 reject）
              if (
                customizeRef?.current?.validate &&
                !customizeRef.current.validate()
              ) {
                throw new Error("customize validate failed");
              }
              return Api.createOrder({
                pay_key: "payPal",
                total_price: orderPricing.total_price,
                shipping_fee: orderPricing.shipping_fee,
                discount: orderPricing.discount,
                pay_price: orderPricing.pay_price,
                pricing_area_code: area,
                order_list: orderList
              })
                .then((res) => {
                  if (res.code === 0) {
                    secret.current = res.data.secret;
                    trackingInitiateCheckout();

                    localStorage.setItem(
                      "order",
                      JSON.stringify({
                        secret: res.data.secret,
                        time: Date.now()
                      })
                    );
                    return res.data.id;
                  } else {
                    throw new Error("code !== 0");
                  }
                })
                .catch((error) => {
                  console.log(`[Page Paypal createOrder]: ${error}`);
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
              console.log(`[Page Paypal onError]: ${error}`);
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
}

export default function GoodBtnList() {
  const { showCartModal } = React.useContext(GlobalContext);
  const {
    LANG,
    CONFIG,
    productInfo,
    locale,
    productNum,
    productCurCombo,
    optionAxes,
    optionSelection,
    customizeRef
  } = React.useContext(ProductContext);
  // 购物车 options 由选中的变体轴值派生（axis_name→value_label）；无选项轴则为空。
  const cartOptions = React.useMemo(() => {
    return (optionAxes || []).map((axis) => {
      const code = optionSelection?.[axis.axis_code];
      const val = axis.values.find((v) => v.value_code === code);
      return {
        name: axis.axis_name,
        value: val?.value_label || "",
        desc: ""
      };
    });
  }, [optionAxes, optionSelection]);
  const area = readClientArea();
  const countryCode = React.useMemo(() => {
    let countryCode;
    if (area === "hk_en") {
      countryCode = "HK";
    } else if (area === "ca_en") {
      countryCode = "CA";
    } else if (area === "c2") {
      countryCode = "CN";
    } else {
      countryCode = area?.toUpperCase() || "US";
    }
    return countryCode;
  }, [area]);

  const currency = React.useMemo(() => {
    return productCurCombo?.areaInfo?.currency || "USD";
  }, [productCurCombo]);

  const paypalEnabled = React.useMemo(() => {
    const paypal = CONFIG["setting.pay"]?.paypal;
    return (
      paypal?.enabled === true &&
      Array.isArray(paypal?.supportArea) &&
      paypal.supportArea.includes(area)
    );
  }, [CONFIG, area]);

  return (
    <div className={styles.container} data-role="buy-btn-list">
      {!productCurCombo.areaInfo?.product_price ||
      !productCurCombo.areaInfo?.stock ? (
        <div className={styles.btn_stock}>{LANG["store.product.no_stock"]}</div>
      ) : (
        <>
          <div
            onClick={() => {
              if (
                !productCurCombo?.areaInfo?.product_price ||
                !productCurCombo?.areaInfo?.stock
              )
                return;

              // 定制字段必填校验：未通过则由 CustomizationFields 内联报错并阻断加购
              if (customizeRef?.current?.validate && !customizeRef.current.validate()) {
                return;
              }
              const customizeData = customizeRef?.current?.getData
                ? customizeRef.current.getData()
                : [];

              let cartList = window.localStorage.getItem("store_shopping");
              try {
                cartList = JSON.parse(cartList) ?? [];
              } catch {
                cartList = [];
              }
              let newCart = [
                {
                  sortKey: productInfo.sort_key,
                  productKey: productInfo.key,
                  comboKey: productCurCombo.key,
                  productNum,
                  options: cartOptions,
                  customize_data: customizeData
                }
              ];
              if (cartList?.length > 0) {
                let includeCurCombo = false;
                const customizeKey = JSON.stringify(customizeData);
                const returnCart = cartList.map((item) => {
                  if (
                    item.sortKey === productInfo.sort_key &&
                    item.productKey === productInfo.key &&
                    item.comboKey === productCurCombo.key &&
                    (typeof item.options === "object"
                      ? JSON.stringify(item.options)
                      : item.options) === JSON.stringify(cartOptions) &&
                    JSON.stringify(item.customize_data || []) === customizeKey
                  ) {
                    includeCurCombo = true;
                    return {
                      ...item,
                      productNum: Number(item.productNum) + productNum
                    };
                  } else {
                    return item;
                  }
                });
                if (includeCurCombo) {
                  newCart = returnCart;
                } else {
                  newCart = [...newCart, ...returnCart];
                }
              }
              tracking.addToCart({ productName: productInfo.name });
              window.localStorage.setItem(
                "store_shopping",
                JSON.stringify(newCart)
              );
              showCartModal();
            }}
            className={styles.btn_add_to_cart}
          >
            {LANG["store.product.add_cart"]}
          </div>
          {paypalEnabled ? (
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
              <PayButton
                LANG={LANG}
                CONFIG={CONFIG}
                locale={locale}
                currency={currency}
                area={area}
                productInfo={productInfo}
                productCurCombo={productCurCombo}
                productOptions={cartOptions}
                productNum={productNum}
                customizeRef={customizeRef}
              />
            </PayPalScriptProvider>
          ) : null}
        </>
      )}
    </div>
  );
}
