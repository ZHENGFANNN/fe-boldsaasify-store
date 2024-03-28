"use client";

import {
  PayPalScriptProvider,
  PayPalButtons,
  usePayPalScriptReducer,
} from "@paypal/react-paypal-js";
import styles from "./index.module.scss";
import React from "react";
import Loading from "@/components/Loading";

import ShowTipModal from "@/components/Modal/ShowTipModal";
import ProductContext from "../../ProductContext";

import { useRouter } from "next/navigation";
import tracking from "../../tracking";
import GlobalContext from "@/globalContext";

import roundToTwoDecimalPlaces from "@/utils/roundToTwoDecimalPlaces";

import Api from "../../api";

function PayButton({
  goodDiscountFestival,
  productInfo,
  productCurCombo,
  productOptions,
  productNum,
  locale,
  LANG,
  CONFIG,
  currency,
}) {
  const { userInfo = {} } = React.useContext(GlobalContext);
  const [{ isPending, isRejected, options }, dispatch] =
    usePayPalScriptReducer();
  const router = useRouter();
  const tipRef = React.useRef(null);
  const secret = React.useRef();
  const showTip = React.useCallback(({ text, type }) => {
    tipRef.current.show({ text, type });
  }, []);

  const discount = React.useMemo(() => {
    if (!productCurCombo.areaInfo.product_discount || !goodDiscountFestival) {
      return 0;
    } else {
      return roundToTwoDecimalPlaces(
        (productCurCombo.areaInfo.product_price -
          productCurCombo.areaInfo.selling_price) *
          productNum
      );
    }
  }, [productCurCombo, productNum]);

  const totalPrice = React.useMemo(() => {
    return roundToTwoDecimalPlaces(
      productCurCombo.areaInfo.product_price * productNum
    );
  });

  const orderList = React.useMemo(() => {
    return [
      {
        // 套餐相关
        id: productCurCombo.id,
        comboName: productCurCombo.title,
        // 地区相关
        priceSymbol: productCurCombo.areaInfo.currency_symbol,
        priceCurrency: productCurCombo.areaInfo.currency,
        product_price: productCurCombo.areaInfo.product_price,
        selling_price: productCurCombo.areaInfo.selling_price,
        product_discount: productCurCombo.areaInfo.product_discount || 0,
        stock: productCurCombo.areaInfo.stock,
        // 产品相关
        name: productInfo.name,
        image: productInfo.image_list[0].src,
        href: `/${locale}/product/${productInfo.sort_key}/${productInfo.key}`,
        sortKey: productInfo.sort_key,
        productKey: productInfo.key,
        comboKey: productCurCombo.key,
        // 其他
        productNum,
        options: productOptions,
      },
    ];
  }, [productNum, productCurCombo, productInfo, productOptions, locale]);

  if (isRejected) {
    return (
      <div className={styles.pay_error_container}>
        <div
          className={styles.btn_container}
          onClick={() => {
            dispatch({
              type: "resetOptions",
              value: options,
            });
          }}
        >
          <div className={styles.title}>
            {LANG["store.product.pay_fail.title"]}
          </div>
          <div className={styles.button}>
            {LANG["store.product.pay_fail.click_reload"]}
          </div>
        </div>
        <div className={styles.tip}>
          {LANG["store.product.pay_fail.error_tip"]?.replace(
            "${email}",
            CONFIG["company.basic.customer_service"]
          )}
        </div>
      </div>
    );
  } else {
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
            }}
            forceReRender={[
              productNum,
              productCurCombo,
              productInfo,
              locale,
              discount,
              currency,
            ]}
            createOrder={async () => {
              // 处理订单
              return Api.createOrder({
                ...userInfo,
                pay_key: "payPal",
                total_price: totalPrice,
                discount,
                order_list: orderList,
              })
                .then((res) => {
                  if (res.code === 0) {
                    secret.current = res.data.secret;
                    tracking.initiateCheckout({
                      currency: orderList[0].priceCurrency,
                      value: roundToTwoDecimalPlaces(totalPrice - discount),
                      discount: roundToTwoDecimalPlaces(discount),
                      type: "payPal",
                      contents: orderList,
                    });

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
                .catch((error) => {
                  console.log(`[Page Paypal createOrder]: ${error}`);
                  showTip({
                    text: LANG["store.order.create_error"],
                    type: "error",
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
                      discount,
                      type: "payPal",
                      contents: orderList,
                    });
                    showTip({
                      text: LANG["store.order.pay_success"],
                      type: "success",
                    });
                    // 移除订单信息
                    localStorage.removeItem("order");
                    setTimeout(() => {
                      router.push(
                        `/store/order/info?secret=${res.data.secret}`
                      );
                    }, 1000);
                  } else {
                    throw new Error("code !== 0");
                  }
                })
                .catch(() => {
                  console.log(`[Page Paypal onApprove]: ${error}`);
                  showTip({
                    text: LANG["store.order.pay_fail_tip"],
                    type: "error",
                  });
                });
            }}
            onCancel={(data) => {
              if (data.orderID) {
                showTip({
                  text: LANG["store.order.pay_cancel"],
                  type: "error",
                });
                setTimeout(() => {
                  router.push(`/store/order/info?secret=${secret.current}`);
                }, 1000);
              }
            }}
            onError={(error) => {
              console.log(`[Page Paypal onError]: ${error}`);
              showTip({
                text: LANG["store.order.pay_error"],
                type: "error",
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
    goodDiscountFestival,
    productInfo,
    locale,
    area,
    productNum,
    productCurCombo,
    productOptions,
  } = React.useContext(ProductContext);
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

  return (
    <div className={styles.container} data-role="buy-btn-list">
      {/* 库存按钮 */}
      {!productCurCombo.areaInfo?.product_price ||
      !productCurCombo.areaInfo?.stock ? (
        <div className={styles.btn_stock}>{LANG["store.product.no_stock"]}</div>
      ) : (
        // 购买按钮
        <>
          {/* 加入购物车 */}
          <div
            onClick={() => {
              if (
                !productCurCombo?.areaInfo?.product_price ||
                !productCurCombo?.areaInfo?.stock
              )
                return;

              let cartList = window.localStorage.getItem("store_shopping");
              try {
                cartList = JSON.parse(cartList) ?? [];
              } catch {
                cartList = [];
              }
              // 新卡片
              let newCart = [
                {
                  sortKey: productInfo.sort_key,
                  productKey: productInfo.key,
                  comboKey: productCurCombo.key,
                  productNum,
                  options: productOptions,
                },
              ];
              // 购物车是否存在
              if (cartList?.length > 0) {
                let includeCurCombo = false;
                const returnCart = cartList.map((item) => {
                  if (
                    item.sortKey === productInfo.sort_key &&
                    item.productKey === productInfo.key &&
                    item.comboKey === productCurCombo.key &&
                    (typeof item.options === "object"
                      ? JSON.stringify(item.options)
                      : item.options) === JSON.stringify(productOptions)
                  ) {
                    includeCurCombo = true;
                    return {
                      ...item,
                      productNum: Number(item.productNum) + productNum,
                    };
                  } else {
                    return item;
                  }
                });
                // 判断是否商品是否购物车里
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
          {/* Paypal按钮 */}
          <PayPalScriptProvider
            options={{
              clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID,
              components: "buttons",
              currency,
              locale: `${
                locale === "hk" || locale === "cn" ? "zh" : locale
              }_${countryCode}`,
            }}
          >
            <PayButton
              LANG={LANG}
              CONFIG={CONFIG}
              locale={locale}
              currency={currency}
              productInfo={productInfo}
              productCurCombo={productCurCombo}
              productOptions={productOptions}
              productNum={productNum}
              goodDiscountFestival={goodDiscountFestival}
            />
          </PayPalScriptProvider>
        </>
      )}
    </div>
  );
}
