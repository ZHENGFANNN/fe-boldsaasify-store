"use client";

import styles from "../../page.module.scss";
import Api from "../../api";

import tracking from "../../../tracking";
import React from "react";
import Paypal from "../../../component/Paypal";

import { useRouter } from "next/navigation";
import moment from "moment";

import ShowTipModal from "@/components/Modal/ShowTipModal";
import Loading from "@/components/Loading";
import { formatCurrency } from "@/utils";

export default function Main({ secret, locale, area, LANG, CONFIG }) {
  const router = useRouter();
  const [order, setOrder] = React.useState();
  const [loading, setLoading] = React.useState(true);
  React.useEffect(() => {
    setLoading(true);
    Api.getOrderDetail({
      secret,
    })
      .then((res) => {
        if (res.code === 0) {
          setOrder({
            ...res.data,
            order_list: res.data.order_list.map((item) => {
              const {
                name,
                comboName,
                productNum,
                priceSymbol,
                priceCurrency,
                priceUnit,
                sellingPrice,
                productPrice,
                productDiscount,
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
                sellingPrice,
                productPrice,
                productDiscount,
                options,
                image,
                customize_data: Array.isArray(item.customize_data)
                  ? item.customize_data
                  : [],
              };
            }),
          });
        } else {
          throw new Error("code !== 0");
        }
      })
      .catch(() => {
        router.push("/");
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const payMap = React.useMemo(() => {
    return {
      wechat: LANG["store.order_info.wechat"],
      zhifubao: LANG["store.order_info.zhifubao"],
      bank: LANG["store.order_info.transfer"],
      creditCard: LANG["store.order_info.credit_card"],
      payPal: LANG["store.order_info.paypal"],
      stripe: LANG["store.order_info.credit_card"] || "Card",
      cod: LANG["store.order_info.pay_after_arrival"],
    };
  }, []);

  const orderStatus = React.useMemo(() => {
    return {
      status0: LANG["store.order_info.await_pay"],
      status1: LANG["store.order_info.await_deliver"],
      status2: LANG["store.order_info.delivered"],
      status3: LANG["store.order_info.finished"],
      status4: LANG["store.order_info.closed"],
      status5: LANG["store.order_info.error"],
    };
  }, []);

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

  return (
    <div className={styles.container}>
      {loading || !order ? (
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
                  {moment(order.order_time).format("YYYY-MM-DD HH:mm")}
                </p>
              </li>
              {order.pay_time ? (
                <li>
                  <h3 className={styles.flex_2}>
                    {LANG["store.order_info.pay_time"]}
                  </h3>
                  <p className={styles.flex_3}>
                    {moment(order.pay_time).format("YYYY-MM-DD HH:mm")}
                  </p>
                </li>
              ) : null}

              {order.deliver_time ? (
                <li>
                  <h3 className={styles.flex_2}>
                    {LANG["store.order_info.deliver_time"]}
                  </h3>
                  <p className={styles.flex_3}>
                    {moment(order.deliver_time).format("YYYY-MM-DD HH:mm")}
                  </p>
                </li>
              ) : null}

              {order.finish_time ? (
                <li>
                  <h3 className={styles.flex_2}>
                    {LANG["store.order_info.finish_time"]}
                  </h3>
                  <p className={styles.flex_3}>
                    {moment(order.finish_time).format("YYYY-MM-DD HH:mm")}
                  </p>
                </li>
              ) : null}

              <li>
                <h3 className={styles.flex_2}>
                  {LANG["store.order_info.order_status"]}
                </h3>
                <p className={styles.flex_3}>
                  <span
                    className={`
                ${
                  order.order_status === "status0" ||
                  order.order_status === "status5"
                    ? styles.error
                    : ""
                }
                ${order.order_status === "status1" ? styles.yellow : ""}
                ${order.order_status === "status2" ? styles.blue : ""}
                ${order.order_status === "status3" ? styles.green : ""}
                ${order.order_status === "status4" ? styles.black : ""}
                `}
                  >
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
                  order.order_list[0].priceUnit
                )}`}</p>
              </li>

              {order.discount ? (
                <>
                  <li>
                    <h3 className={styles.flex_2}>
                      {LANG["store.order_info.discount_price"]}
                    </h3>
                    <p className={styles.flex_3}>
                      <span className={styles.red}>{`- ${
                        order.order_list[0].priceSymbol
                      }${formatCurrency(
                        order.discount,
                        order.order_list[0].priceUnit
                      )}`}</span>
                    </p>
                  </li>
                  <li>
                    <h3 className={styles.flex_2}>
                      {LANG["store.order_info.real_price"]}
                    </h3>
                    <p className={styles.flex_3}>{`${
                      order.order_list[0].priceSymbol
                    }${formatCurrency(
                      order.total_price - order.discount,
                      order.order_list[0].priceUnit
                    )}`}</p>
                  </li>
                </>
              ) : null}

              {order.pay_price ? (
                <li>
                  <h3 className={styles.flex_2}>
                    {LANG["store.order_info.pay_price"]}
                  </h3>
                  <p className={styles.flex_3}>{`${
                    order.order_list[0].priceSymbol
                  }${formatCurrency(
                    order.pay_price,
                    order.order_list[0].priceUnit
                  )}`}</p>
                </li>
              ) : null}

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
                                        <a
                                          key={`${f.url}-${idx}`}
                                          href={f.url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          title={f.name}
                                        >
                                          {f.name}
                                          {idx < files.length - 1 ? ", " : ""}
                                        </a>
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
                        {goodItem.productDiscount ? (
                          <div className={styles.good_price}>{`${
                            goodItem.priceSymbol
                          }${formatCurrency(
                            goodItem.sellingPrice * goodItem.productNum,
                            order.order_list[0].priceUnit
                          )}`}</div>
                        ) : null}
                        <div className={styles.good_price}>{`${
                          goodItem.priceSymbol
                        }${formatCurrency(
                          goodItem.productPrice * goodItem.productNum,
                          order.order_list[0].priceUnit
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
            {order.pay_key === "payPal" && order.order_status === "status0" ? (
              <div className={styles.btn_container}>
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
                        order.first_name && order.address1 ? "order_page" : "",
                    })
                      .then((res) => {
                        if (res.code === 0) {
                          tracking.purchase({
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
              </div>
            ) : null}
          </div>
        </>
      )}
      <ShowTipModal ref={tipRef} />
    </div>
  );
}
