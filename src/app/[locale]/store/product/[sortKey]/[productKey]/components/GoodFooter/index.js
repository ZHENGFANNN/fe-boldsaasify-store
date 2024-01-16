"use client";

import React from "react";
import styles from "./index.module.scss";
import useProductStore from "../../productStore";
import ProductContext from "../../productContext";
import tracking from "../../tracking";
import { useRouter, useSearchParams } from "next/navigation";
import {
  PayPalScriptProvider,
  PayPalButtons,
  usePayPalScriptReducer,
} from "@paypal/react-paypal-js";

import GlobalContext from "@/globalContext";
import Loading from "@/components/Loading";
import ShowTipModal from "@/components/Modal/ShowTipModal";

import Api from "../../api";

function PayButton({
  goodDiscountFestival,
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
    if (!productCurCombo.areaInfo.good_discount || !goodDiscountFestival) {
      return 0;
    } else {
      return (
        Math.ceil(
          productCurCombo.areaInfo.price *
            (100 - productCurCombo.areaInfo.good_discount) *
            0.01
        ) * productNum || 0
      );
    }
  }, [productCurCombo, productNum]);

  const totalPrice = React.useMemo(() => {
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

  return (
    <>
      {isPending ? (
        <Loading height={108} />
      ) : (
        <PayPalButtons
          style={{
            layout: "horizontal",
            color: "black",
            label: "paypal",
            shape: "pill",
            tagline: "false",
            height: 36,
          }}
          forceReRender={[
            productNum,
            productCurCombo,
            productInfo,
            locale,
            discount,
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
                    router.push(`/store/order/info?secret=${res.data.secret}`);
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

export default function GoodFooter({
  locale,
  areaCode,
  LANG,
  productInfo,
  goodDiscountFestival,
}) {
  const { lazyLoading } = React.useContext(ProductContext);
  const productNum = useProductStore((state) => state.productNum);
  const productOptions = useProductStore((state) => state.productOptions);
  const productCurCombo = useProductStore((state) => state.productCurCombo);
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderPage = searchParams.get("order_page");

  // Footer处理
  React.useEffect(() => {
    if (!lazyLoading) {
      const $footerDom = $('[data-role="footer-buy"]');
      // 计算底部位置
      const height = $footerDom.outerHeight();
      $("[data-role='footer-info']").css({
        paddingBottom: height,
      });
      // 埋点 - 查看次数
      tracking.viewContent({
        productName: productInfo.key,
      });

      // 滚动展示底部位置
      const $btnDom = $('[data-role="buy-btn-list"]').eq(0);
      function computedFooterBottom() {
        const btnTop = $btnDom.offset()?.top;
        if (btnTop) {
          const scrollTop = $(document).scrollTop();
          if (scrollTop > btnTop) {
            $footerDom.css({
              bottom: 0,
            });
          } else {
            $footerDom.css({
              bottom: "-100%",
            });
          }
        } else {
          $footerDom.css({
            bottom: 0,
          });
        }
      }
      computedFooterBottom();
      $(window).on("scroll", () => computedFooterBottom());
      return () => {
        $(window).off("scroll", () => computedFooterBottom());
        $("[data-role='footer-info']").css({
          paddingBottom: 0,
        });
      };
    }
  }, [lazyLoading]);

  const countryCode = React.useMemo(() => {
    let countryCode = areaCode;
    if (areaCode === "hk_en") {
      countryCode = "HK";
    } else if (areaCode === "ca_en") {
      countryCode = "CA";
    } else if (areaCode === "c2") {
      return "CN";
    } else {
      return countryCode?.toUpperCase() || "US";
    }
  }, [areaCode]);

  const currency = React.useMemo(() => {
    let areaInfo = productCurCombo?.areaInfo;
    if (areaInfo) {
      return areaInfo.currency;
    } else {
      return "USD";
    }
  }, [productCurCombo, areaCode]);

  return (
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
      <section data-role="footer-buy" className={styles.footer_container}>
        {/* 底部 - 加入购物车 */}
        <div className={styles.footer_content}>
          <div className={styles.footer_left}>
            <h3>
              {productInfo.name}{" "}
              {productNum > 1 ? <span>{` × ${productNum}`}</span> : null}
            </h3>
            <div className={styles.express_time}>
              <img
                alt="express"
                src={`${process.env.NEXT_PUBLIC_IMAGE}/icon/min-express.png`}
              />
              <span
                dangerouslySetInnerHTML={{
                  __html: LANG["store.product.deliver_time"]
                    ?.split("${1}")
                    ?.join("7"),
                }}
              />
            </div>
          </div>
          <div className={styles.footer_right}>
            <div className={styles.footer_price}>
              {productCurCombo.areaInfo?.price ? (
                <div className={styles.price}>
                  {goodDiscountFestival &&
                  productCurCombo.areaInfo.good_discount ? (
                    <div>{`${productCurCombo.areaInfo.currency_symbol}${
                      productCurCombo.areaInfo.currency
                    } ${
                      Math.floor(
                        productCurCombo.areaInfo.price *
                          productCurCombo.areaInfo.good_discount *
                          0.01
                      ) * productNum
                    }`}</div>
                  ) : null}
                  <div>{`${productCurCombo.areaInfo.currency_symbol}${
                    productCurCombo.areaInfo.currency
                  } ${productCurCombo.areaInfo.price * productNum}`}</div>
                </div>
              ) : null}
              {goodDiscountFestival &&
              productCurCombo.areaInfo.good_discount ? (
                <div className={styles.save_price}>
                  -{" "}
                  {`${productCurCombo.areaInfo.currency_symbol}${
                    productCurCombo.areaInfo.currency
                  } ${
                    Math.ceil(
                      (100 - productCurCombo.areaInfo.good_discount) *
                        0.01 *
                        productCurCombo.areaInfo.price
                    ) * productNum
                  }`}
                </div>
              ) : null}
            </div>
            <div className={styles.paypal_container}>
              <PayButton
                goodDiscountFestival={goodDiscountFestival}
                productInfo={productInfo}
                productCurCombo={productCurCombo}
                productOptions={productOptions}
                productNum={productNum}
                locale={locale}
                LANG={LANG}
              />
            </div>
            {/* <div
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
                if (orderPage) {
                  window.localStorage.setItem(
                    "single_store_shopping",
                    JSON.stringify(newCart)
                  );
                  tracking.addToCart({ productName: productInfo.name });
                  router.push(`/store/order?single_good=true`);
                } else {
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
                }
              }}
              className={`${styles.footer_button} ${
                !productCurCombo?.areaInfo?.price ||
                !productCurCombo?.areaInfo?.stock
                  ? styles.disabled
                  : ""
              }`}
            >
              {productCurCombo?.areaInfo?.price &&
              productCurCombo?.areaInfo?.stock ? (
                <>
                  {orderPage
                    ? LANG["store.product.immedate_order"]
                    : LANG["store.product.add_cart"]}
                </>
              ) : (
                LANG["store.product.no_stock"]
              )}
            </div> */}
          </div>
        </div>
      </section>
    </PayPalScriptProvider>
  );
}
