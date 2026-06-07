/** @format */

"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";

import GlobalContext from "@/[locale]/context";
import PayList from "../PayList";
import UserInfo from "../UserType";
import Api from "../../api";
import tracking from "../../tracking";
import OrderContext from "../../context";
import AddressList from "../AddressList";
import AddressForm from "../AddressForm";
import NewAddressForm from "../NewAddressForm";
import { domesticPay, foreignPay } from "../../const";
import Paypal from "../Paypal";

import ShowTipModal from "@/components/Modal/ShowTipModal";
import Loading from "@/components/Loading";
import Advantage from "@/components/Layout/Advantage";
import { formatCurrency, roundToDecimalPlaces } from "@/utils";

import styles from "./index.module.scss";
import Cookies from "js-cookie";

export default function Main({
  CONFIG,
  LANG,
  GOODDISCOUNTFESTIVAL,
  area,
  token,
}) {
  const router = useRouter();
  const { locale } = useParams();
  const { PRODUCT } = React.useContext(GlobalContext);
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
      Array.isArray(paypal?.supportArea) &&
      paypal.supportArea.includes(area)
    );
  }, [CONFIG, area]);

  // 选中支付方式
  const [payKey, setPayKey] = React.useState();
  const payWayList = React.useMemo(() => {
    const base =
      locale === "zh-cn"
        ? domesticPay({ CONFIG, LANG })
        : foreignPay({ CONFIG, LANG });
    // PayPal 受 setting.pay.paypal.enabled + supportArea 门控
    const pay = base.filter((item) =>
      item.key === "payPal" ? paypalEnabled : true
    );
    setPayKey(pay[0]?.key);
    return pay;
  }, [locale, paypalEnabled]);

  // 设置销售政策
  React.useEffect(() => {
    const $dom = document.getElementsByClassName(styles.sales_content)[0];
    const $aTags = $dom.getElementsByTagName("a")[0];
    $aTags?.setAttribute("href", `/protocol/sales`);
    $aTags?.setAttribute("target", "_blank");
  }, []);

  // 订单列表
  const [orderList, setOrderList] = React.useState([]);
  React.useEffect(() => {
    // 获取购物车列表
    let localStoreList = window.localStorage.getItem("store_shopping");
    try {
      localStoreList = JSON.parse(localStoreList ?? []);
      const list = [];
      localStoreList.forEach((item) => {
        let comboInfo;
        const product = PRODUCT.cart.find(
          (product) =>
            item.productKey === product.key && item.sortKey === product.sort_key
        );
        if (product) {
          comboInfo = product.comboList.find(
            (combo) => combo.key === item.comboKey
          );
        }

        // 处理选项
        let options;
        try {
          if (typeof item.options === "object") {
            options = item.options;
          } else {
            options = JSON.parse(item.options);
          }
        } catch {
          options = [];
        }

        if (
          comboInfo?.areaInfo &&
          comboInfo &&
          product &&
          comboInfo?.areaInfo?.stock
        ) {
          const itemData = {
            // 套餐相关
            id: comboInfo.id,
            comboName: comboInfo.title,
            // 地区相关
            priceSymbol: comboInfo.areaInfo.currency_symbol,
            priceCurrency: comboInfo.areaInfo.currency,
            priceUnit: comboInfo.areaInfo.currency_unit,
            productPrice: comboInfo.areaInfo.product_price,
            sellingPrice: comboInfo.areaInfo.selling_price,
            productDiscount: comboInfo.areaInfo.product_discount,
            stock: comboInfo.areaInfo.stock,
            // 产品相关
            name: product.name,
            image: product.image,
            href: `/${locale}/product/${product.sort_key}/${product.key}`,
            sortKey: product.sort_key,
            productKey: product.key,
            comboKey: comboInfo.key,
            // 其他
            productNum: item.productNum,
            options,
          };
          list.push(itemData);
        }
      });
      if (list.length === 0) {
        location.href = `/${locale}`;
      }
      setOrderList(list);
    } catch (err) {
      localStorage.setItem("store_shopping", JSON.stringify([]));
      console.log("【购物列表解析失败】", err);
    }
  }, [payKey]);

  // 计算总价
  const totalPrice = React.useMemo(() => {
    return orderList.reduce((pre, cur) => {
      return pre + cur.productPrice * cur.productNum;
    }, 0);
  }, [orderList]);

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

  const discount = React.useMemo(() => {
    return orderList.reduce((pre, cur) => {
      if (GOODDISCOUNTFESTIVAL && cur.productDiscount) {
        return pre + (cur.productPrice - cur.sellingPrice) * cur.productNum;
      } else {
        return pre;
      }
    }, 0);
  }, [orderList, GOODDISCOUNTFESTIVAL]);

  // 获取用户信息
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

  // 清空购物车
  const clearOrderList = React.useCallback(() => {
    // 获取购物车列表
    window.localStorage.removeItem("store_shopping");
  }, []);

  // 埋点
  const trackingInitiateCheckout = React.useCallback(() => {
    tracking.initiateCheckout({
      from: "order_page",
      currency: orderList[0].priceCurrency,
      value: totalPrice - discount,
      discount,
      type: "payPal",
      contents: orderList,
    });
  }, [orderList, totalPrice, discount]);

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
                    <AddressForm LANG={LANG} ref={addressRef} />
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
            {totalPrice ? (
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
                          {GOODDISCOUNTFESTIVAL && item.productDiscount ? (
                            <div className={styles.discount}>{`${
                              item.priceSymbol
                            }${formatCurrency(
                              item.sellingPrice * item.productNum,
                              item.priceUnit
                            )}`}</div>
                          ) : null}
                          <div>{`${item.priceSymbol}${formatCurrency(
                            item.productPrice * item.productNum,
                            item.priceUnit
                          )}`}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className={styles.price_list}>
                  <div className={styles.price_item}>
                    <h3>{LANG["store.order.good_total"]}</h3>
                    <span>{`${orderList[0]?.priceSymbol}${formatCurrency(
                      totalPrice - discount,
                      orderList[0]?.priceUnit
                    )}`}</span>
                  </div>
                  <div className={styles.price_item}>
                    <h3>{LANG["store.order.express_price"]}</h3>
                    <span>{LANG["store.order.express_free"]}</span>
                  </div>
                  <div className={styles.price_item}>
                    <h3>{LANG["store.order.tax"]}</h3>
                    <span>{LANG["store.order.tax_include"]}</span>
                  </div>
                </div>
                <div className={styles.price_total}>
                  <h3>{LANG["store.order.total_price"]}</h3>
                  <span>{`${orderList[0]?.priceSymbol}${formatCurrency(
                    totalPrice - discount,
                    orderList[0]?.priceUnit
                  )}`}</span>
                </div>
              </>
            ) : (
              <Loading height={300} />
            )}
            <div
              className={styles.sales_content}
              dangerouslySetInnerHTML={{
                __html: LANG["store.order.order_policy"]
                  .split("${1}")
                  .join(CONFIG["common.base"]?.company_name),
              }}
            />
            {/* 银行支付方式 */}
            {payKey === "bank" || payKey === "cod" ? (
              <div
                className={styles.submit_btn}
                onClick={async () => {
                  if (orderLoading) return;
                  const userInfo = getUserInfo();
                  if (!userInfo) return;
                  // 处理订单
                  try {
                    setOrderLoading(true);
                    const res = await Api.createOrder({
                      ...userInfo,
                      pay_key: payKey,
                      total_price: roundToDecimalPlaces(
                        totalPrice,
                        orderList[0]?.priceUnit
                      ),
                      discount: roundToDecimalPlaces(
                        discount,
                        orderList[0]?.priceUnit
                      ),
                      order_list: orderList,
                    });
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
                        if (userType === "user" && !addressInfo) {
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
                        const userInfo = getUserInfo();
                        if (!userInfo) return;
                        return Api.createOrder({
                          ...userInfo,
                          pay_key: payKey,
                          total_price: roundToDecimalPlaces(
                            totalPrice,
                            orderList[0]?.priceUnit
                          ),
                          discount: roundToDecimalPlaces(
                            discount,
                            orderList[0]?.priceUnit
                          ),
                          order_list: orderList,
                        })
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
                          .catch(() => {
                            showTip({
                              text: LANG["common.pay.pay_button.create_error"],
                              type: "error",
                            });
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
                                discount,
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
          </div>
        </div>
        <Advantage LANG={LANG} />
        <ShowTipModal ref={tipRef} />
      </div>
    </OrderContext.Provider>
  );
}
