"use client";

import styles from "../../page.module.scss";
import Api from "../../api";

import tracking from "../../../tracking";
import React from "react";
import Paypal from "../../../component/Paypal";
import ShowTipModal from "@/components/Modal/ShowTipModal";

import { useRouter } from "next/navigation";
import Loading from "@/components/Loading";
import moment from "moment";

import { formatCurrency } from "@/utils";

export default function Main({ secret, locale, area, LANG, CONFIG }) {
  const router = useRouter();
  const [order, setOrder] = React.useState();
  const [loading, setLoading] = React.useState(true);
  React.useEffect(() => {
    setLoading(true);
    Api.getOrderList({
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
                currency_unit,
                selling_price,
                product_price,
                product_discount,
                options,
                image,
              } = item;
              return {
                name,
                comboName,
                productNum,
                priceSymbol,
                priceCurrency,
                currency_unit,
                selling_price,
                product_price,
                product_discount,
                options,
                image,
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

  React.useEffect(() => {
    if (order) {
      tracking.enterOrderDetail({
        currency: `${order.order_list[0].priceSymbol}${order.order_list[0].priceCurrency}`,
        value: order.total_price,
        discount: order.discount,
        contents: order.order_list,
      });
    }
  }, [order]);

  const payMap = React.useMemo(() => {
    return {
      wechat: LANG["store.order_info.wechat"],
      zhifubao: LANG["store.order_info.zhifubao"],
      bankTransfer: LANG["store.order_info.transfer"],
      creditCard: LANG["store.order_info.credit_card"],
      payPal: LANG["store.order_info.paypal"],
      COD: LANG["store.order_info.pay_after_arrival"],
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
                  .join(`/company/contact`),
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
                  order.order_list[0].currency_unit
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
                        order.order_list[0].currency_unit
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
                      order.order_list[0].currency_unit
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
                    order.order_list[0].currency_unit
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
                          <div className={styles.good_number}>
                            × {goodItem.productNum}
                          </div>
                        </div>
                      </div>
                      <div className={styles.product_number}>
                        {goodItem.product_discount ? (
                          <div className={styles.good_price}>{`${
                            goodItem.priceSymbol
                          }${formatCurrency(
                            goodItem.selling_price * goodItem.productNum,
                            order.order_list[0].currency_unit
                          )}`}</div>
                        ) : null}
                        <div className={styles.good_price}>{`${
                          goodItem.priceSymbol
                        }${formatCurrency(
                          goodItem.product_price * goodItem.productNum,
                          order.order_list[0].currency_unit
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
          {order.pay_key === "bankTransfer" ? (
            <div className={styles.transfer_container}>
              <div className={styles.transfer_title}>
                <h3>{LANG["store.order_info.transfer_pay"]}</h3>
              </div>
              <p className={styles.transfer_description}>
                {LANG["store.order_info.pay_week"]}
              </p>
              <div className={styles.transfer_detail}>
                <h3>{LANG["store.order_info.bank_account"]}</h3>
                <div className={styles.transfer_detail_list}>
                  <div className={styles.transfer_detail_item}>
                    <h3>{LANG["store.order_info.bank_name"]}</h3>
                    <p>{CONFIG["pay.transfer.name"] || "-"}</p>
                  </div>
                  <div className={styles.transfer_detail_item}>
                    <h3>{LANG["store.order_info.bank_number"]}</h3>
                    <p>{CONFIG["pay.transfer.info"] || "-"}</p>
                  </div>
                  <div className={styles.transfer_detail_item}>
                    <h3>{LANG["store.order_info.bank_address"]}</h3>
                    <p>{CONFIG["pay.transfer.location"] || "-"}</p>
                  </div>
                  {locale !== "cn" ? (
                    <div className={styles.transfer_detail_item}>
                      <h3>{LANG["store.order_info.bank_code"]}</h3>
                      <p>{CONFIG["pay.transfer.code"] || "-"}</p>
                    </div>
                  ) : null}
                </div>
                <h3
                  className={styles.transfer_email}
                  dangerouslySetInnerHTML={{
                    __html: LANG["store.order_info.bank_email"]
                      ?.split("${1}")
                      .join(CONFIG["company.basic.order_service"]),
                  }}
                />
                <div className={styles.transfer_tip_container}>
                  <div>{LANG["store.order_info.notice"]}</div>
                  <div>{LANG["store.order_info.notice_1"]}</div>
                  <div>{LANG["store.order_info.notice_2"]}</div>
                  <div>{LANG["store.order_info.notice_3"]}</div>
                  <div>{LANG["store.order_info.notice_4"]}</div>
                  <div
                    dangerouslySetInnerHTML={{
                      __html: LANG["store.order_info.notice_5"]
                        ?.split("${1}")
                        .join(`/company/contact`),
                    }}
                  />
                </div>
              </div>
              <a href="/" className={styles.btn_container}>
                {LANG["store.order_info.back_store"]}
              </a>
            </div>
          ) : null}
        </>
      )}
      <ShowTipModal ref={tipRef} />
    </div>
  );
}
