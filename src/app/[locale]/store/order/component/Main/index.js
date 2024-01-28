"use client";

import styles from "./index.module.scss";
import React from "react";
import PayList from "../../component/PayList";
import UserInfo from "../../component/UserType";
import GlobalContext from "@/globalContext";
import OrderContext from "../../context";

import { domesticPay, foreignPay } from "../../const";
import ShowTipModal from "@/components/Modal/ShowTipModal";
import Api from "../../api";
import Loading from "@/components/Loading";

import AddressList from "../../component/AddressList";
import AddressForm from "../../component/AddressForm";
import NewAddressForm from "../../component/NewAddressForm";

import formatPrice from "@/utils/formatPrice";
import Advantage from "@/components/Layout/Advantage";

import Paypal from "../../component/Paypal";
import tracking from "../../tracking";

import { useSearchParams, useParams, useRouter } from "next/navigation";

export default function Main({
  CONFIG,
  LANG,
  GOODLIST,
  GOODDISCOUNTFESTIVAL,
  area,
  token,
}) {
  const router = useRouter();
  const { locale } = useParams();
  const searchParams = useSearchParams();
  const singleGood = searchParams.get("single_good");

  const { userInfo } = React.useContext(GlobalContext);
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
  // 用地址
  const [addressInfo, setAddressInfo] = React.useState();
  // 地址列表
  const [addressList, setAddressList] = React.useState([]);
  const [addressLoading, setAddressLoading] = React.useState(false);
  const getAddressList = React.useCallback(() => {
    if (token) {
      setUserType("user");
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
  // 选中支付方式
  const [payKey, setPayKey] = React.useState();
  const payWayList = React.useMemo(() => {
    const pay =
      locale === "cn"
        ? domesticPay({ CONFIG, LANG })
        : foreignPay({ CONFIG, LANG });
    setPayKey(pay[0].key);
    return pay;
  }, [locale]);

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
    let localStoreList = singleGood
      ? window.localStorage.getItem("single_store_shopping")
      : window.localStorage.getItem("store_shopping");
    try {
      localStoreList = JSON.parse(localStoreList ?? []);
      const list = [];
      localStoreList.forEach((item) => {
        if (!item.selected) return;
        let comboInfo, areaInfo;
        const product = GOODLIST.find(
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
            price: comboInfo.areaInfo.price,
            good_discount: comboInfo.areaInfo.good_discount,
            stock: comboInfo.areaInfo.stock,
            // 产品相关
            name: product.name,
            image: product.image_list[0].src,
            href: `/${locale}/product/${product.sort_key}/${product.key}`,
            sortKey: product.sort_key,
            productKey: product.key,
            comboKey: comboInfo.key,
            // 其他
            productNum: item.productNum,
            selected: item.selected,
            options,
          };
          list.push(itemData);
        }
      });
      if (list.length === 0) {
        location.href = `/${locale}/store/cart`;
      }
      setOrderList(list);
    } catch (err) {
      localStorage.setItem("store_shopping", JSON.stringify([]));
      console.log("【购物列表解析失败】", err);
    }
  }, [payKey, singleGood]);

  // 计算总价
  const totalPrice = React.useMemo(() => {
    return orderList.reduce((pre, cur) => {
      return pre + cur.price * cur.productNum;
    }, 0);
  }, [orderList]);

  const discount = React.useMemo(() => {
    return orderList.reduce((pre, cur) => {
      if (GOODDISCOUNTFESTIVAL && cur.good_discount) {
        return (
          pre +
          Math.ceil(cur.price * (100 - cur.good_discount) * 0.01) *
            cur.productNum
        );
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
        text: LANG["store.order.basic_info_tip"],
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
  }, [userType]);

  // 清空购物车
  const clearOrderList = React.useCallback(() => {
    if (singleGood) return;
    // 获取购物车列表
    try {
      let localStoreList = window.localStorage.getItem("store_shopping");
      localStoreList = JSON.parse(localStoreList ?? []);
      localStoreList = localStoreList.filter((item) => !item.selected);
      window.localStorage.setItem(
        "store_shopping",
        JSON.stringify(localStoreList)
      );
    } catch {}
  }, [singleGood]);

  const secret = React.useRef();

  return (
    <OrderContext.Provider
      value={{
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
                <h2>{LANG["store.order.shipping_address"]}</h2>
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
                <h2>{LANG["store.order.pay_way"]}</h2>
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
              <h2>{LANG["store.order.order_remark"]}</h2>
              <div className={styles.textarea_input}>
                <textarea
                  maxLength={500}
                  ref={textareaRef}
                  placeholder={LANG["store.order.order_remark_placeholder"]}
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
                          {GOODDISCOUNTFESTIVAL && item.good_discount ? (
                            <div className={styles.discount}>{`${
                              item.priceSymbol
                            }${item.priceCurrency} ${
                              Math.floor(
                                item.price * item.good_discount * 0.01
                              ) * item.productNum
                            }`}</div>
                          ) : null}
                          <div>{`${item.priceSymbol}${item.priceCurrency} ${
                            item.price * item.productNum
                          }`}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className={styles.price_list}>
                  <div className={styles.price_item}>
                    <h3>{LANG["store.order.good_total"]}</h3>
                    <span>{`${orderList[0]?.priceSymbol}${
                      orderList[0]?.priceCurrency
                    } ${totalPrice - discount}`}</span>
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
                  <span>{`${orderList[0]?.priceSymbol}${
                    orderList[0]?.priceCurrency
                  } ${formatPrice(totalPrice - discount)}`}</span>
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
                  .join(CONFIG["company.basic.company_name"]),
              }}
            />
            {/* 禁用国内支付 */}
            {area === "c2" ? (
              <div
                onClick={() => {
                  tipRef.current.show({
                    text: `请联系邮箱：${CONFIG["company.basic.customer_service"]}`,
                    type: "info",
                  });
                }}
                className={styles.submit_btn}
              >
                暂不支持线上付款
              </div>
            ) : null}

            {/* 银行支付方式 */}
            {payKey === "bankTransfer" || payKey === "COD" ? (
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
                      total_price: totalPrice,
                      discount,
                      order_list: orderList,
                    });
                    if (res.code === 0) {
                      tracking.initiateCheckout({
                        from: "order_page",
                        currency: orderList[0].priceCurrency,
                        value: totalPrice - discount,
                        discount,
                        type: payKey,
                        contents: orderList,
                      });
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
                        router.push(
                          `/store/order/info?secret=${res.data.secret}`
                        );
                      }, 1000);
                    } else {
                      throw new Error("code !== 0");
                    }
                  } catch (error) {
                    setOrderLoading(false);
                    showTip({
                      text: LANG["store.order.create_error"],
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
                      locale={locale}
                      area={area}
                      currency={orderList[0]?.priceCurrency}
                      onError={(error) => {
                        console.log(error);
                        if (userType === "user" && !addressInfo) {
                          return;
                        } else {
                          showTip({
                            text: LANG["store.order.pay_error"],
                            type: "error",
                          });
                        }
                      }}
                      onCancel={(data) => {
                        if (data.orderID) {
                          showTip({
                            text: LANG["store.order.pay_cancel"],
                            type: "error",
                          });
                          setTimeout(() => {
                            clearOrderList();
                            location.href = `/store/order/info?secret=${secret.current}`;
                          }, 1000);
                        }
                      }}
                      createOrder={() => {
                        const userInfo = getUserInfo();
                        if (!userInfo) return;
                        return Api.createOrder({
                          ...userInfo,
                          pay_key: payKey,
                          total_price: totalPrice,
                          discount,
                          order_list: orderList,
                        })
                          .then((res) => {
                            if (res.code === 0) {
                              secret.current = res.data.secret;
                              tracking.initiateCheckout({
                                from: "order_page",
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
                            showTip({
                              text: LANG["store.order.create_error"],
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
                                text: LANG["store.order.pay_success"],
                                type: "success",
                              });
                              // 移除订单信息
                              localStorage.removeItem("order");
                              setTimeout(() => {
                                clearOrderList();
                                location.href = `/store/order/info?secret=${res.data.secret}`;
                              }, 1000);
                            } else {
                              throw new Error("code !== 0");
                            }
                          })
                          .catch(() => {
                            showTip({
                              text: LANG["store.order.pay_fail"],
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
