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

import useProductStore from "../../productStore";
import { useRouter } from "next/navigation";
import tracking from "../../tracking";
import GlobalContext from "@/globalContext";

import Api from "../../api";

function PayButton({
  productInfo,
  productCurCombo,
  productOptions,
  productNum,
  locale,
  LANG,
}) {
  const { userInfo = {} } = React.useContext(GlobalContext);
  const [{ isPending }] = usePayPalScriptReducer();
  const router = useRouter();
  const tipRef = React.useRef(null);
  const secret = React.useRef();
  const showTip = React.useCallback(({ text, type }) => {
    tipRef.current.show({ text, type });
  }, []);

  const discount = React.useMemo(() => {
    return (
      Math.ceil(
        productCurCombo.areaInfo.price *
          (100 - productCurCombo.areaInfo.discount) *
          0.01 *
          productNum
      ) || 0
    );
  }, [productCurCombo, productNum]);

  const totalPrice = React.useMemo(() => {
    console.log("totalPrice", productCurCombo.areaInfo.price * productNum);
    return productCurCombo.areaInfo.price * productNum;
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
        price: productCurCombo.areaInfo.price,
        good_discount: productCurCombo.areaInfo.good_discount || 0,
        stock: productCurCombo.areaInfo.stock,
        // 产品相关
        name: productInfo.name,
        image: productInfo.image_url,
        href: `/${locale}/product/${productInfo.sort_key}/${productInfo.key}`,
        sortKey: productInfo.sort_key,
        productKey: productInfo.key,
        comboKey: productCurCombo.key,
        // 其他
        productNum,
        options: productOptions,
      },
    ];
  }, [productNum, productCurCombo, productInfo, locale]);

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
                    value: totalPrice - discount,
                    discount,
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
              .catch(() => {
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
                    location.href = `/store/order/info?secret=${res.data.secret}`;
                  }, 1000);
                } else {
                  throw new Error("code !== 0");
                }
              })
              .catch(() => {
                console.log(`[Page Paypal onApprove]: ${error}`);
                showTip({
                  text: LANG["store.order.pay_fail"],
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
              // setTimeout(() => {
              //   location.href = `/store/order/info?secret=${secret.current}`;
              // }, 1000);
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

export default function GoodBtnList({ area_code, locale, productInfo, LANG }) {
  const productNum = useProductStore((state) => state.productNum);
  const productCurCombo = useProductStore((state) => state.productCurCombo);
  const productOptions = useProductStore((state) => state.productOptions);

  const router = useRouter();

  const countryCode = React.useMemo(() => {
    let countryCode = area_code;
    if (area_code === "hk_en") {
      countryCode = "hk";
    } else if (area_code === "ca_en") {
      countryCode = "ca";
    }
    return countryCode?.toUpperCase() || "US";
  }, [area_code]);

  const currency = React.useMemo(() => {
    let areaInfo = productCurCombo?.areaInfo;
    if (areaInfo) {
      return areaInfo.currency;
    } else {
      return "USD";
    }
  }, [productCurCombo]);

  return (
    <PayPalScriptProvider
      options={{
        clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID,
        components: "buttons",
        locale: `${locale === "hk" ? "zh" : locale}_${countryCode}`,
        currency,
      }}
    >
      <div className={styles.container} data-role="buy-btn-list">
        <div
          onClick={() => {
            if (
              !productCurCombo?.areaInfo?.price ||
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
                selected: true,
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
            router.push(`/store/cart`);
          }}
          className={styles.btn_add_to_cart}
        >
          {LANG["store.product.add_cart"]}
        </div>
        <PayButton
          LANG={LANG}
          locale={locale}
          productInfo={productInfo}
          productCurCombo={productCurCombo}
          productOptions={productOptions}
          productNum={productNum}
        />
      </div>
    </PayPalScriptProvider>
  );
}
