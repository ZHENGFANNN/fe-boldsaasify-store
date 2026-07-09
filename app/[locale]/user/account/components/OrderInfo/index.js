/** @format */

"use client";

import styles from "./index.module.scss";
import Api from "../../api";
import React from "react";
import Empyt from "../../../../../components/Empyt";
import Loading from "../../../../../components/Loading";
import { formatCurrency } from "@/utils";

export default function OrderInfo({ LANG }) {
  const payMap = React.useMemo(() => {
    return {
      wechat: LANG["user_account.my_order.wechat"],
      zhifubao: LANG["user_account.my_order.zhifubao"],
      bankTransfer: LANG["user_account.my_order.transfer"],
      creditCard: LANG["user_account.my_order.credit_card"],
      payPal: LANG["user_account.my_order.paypal"],
      COD: LANG["user_account.my_order.cod"],
    };
  }, []);
  const orderStatus = React.useMemo(() => {
    return {
      status0: LANG["user_account.my_order.await_pay"],
      status1: LANG["user_account.my_order.await_deliver"],
      status2: LANG["user_account.my_order.delivered"],
      status3: LANG["user_account.my_order.finished"],
      status4: LANG["user_account.my_order.closed"],
      status5: LANG["user_account.my_order.error"],
    };
  }, []);
  const [orderLoading, setOrderLoading] = React.useState(true);
  const [list, setList] = React.useState([]);
  const getList = React.useCallback(() => {
    setOrderLoading(true);
    Api.getOrderList()
      .then((res) => {
        if (res.code !== 0) throw new Error("code!==0");
        setList(res.data?.list ?? []);
        setOrderLoading(false);
      })
      .catch(() => {
        setOrderLoading(false);
      });
  }, []);

  React.useEffect(() => {
    if (list.length < 1) return;

    import("jquery").then(({ default: $ }) => {
      const $orderList = $(`.${styles.order_list}`);
      const $expandIcon = $orderList.find(`.${styles.expand_icon}`);
      const $expandContainer = $orderList.find(`.${styles.expand_container}`);
      const $expandHeight = $orderList.find(`.${styles.expand_height}`);
      $(`.${styles.order_list} .${styles.expand_icon}`).on(
        "click",
        function () {
          const _index = $(
            `.${styles.order_list} .${styles.expand_icon}`
          ).index(this);
          $expandIcon.each(function (index) {
            $(this).find("span").text(LANG["user_account.my_order.expand"]);
            $(this).removeClass(styles.active);
            if ($expandContainer.eq(index).height() > 0 && _index !== index) {
              $expandContainer.eq(index).css({
                height: 0,
              });
            }
          });

          if ($expandContainer.eq(_index).height() > 0) {
            $expandContainer.eq(_index).css({
              height: 0,
            });
            $(this).removeClass(styles.active);
            $(this).find("span").text(LANG["user_account.my_order.expand"]);
          } else {
            const height = $expandHeight.eq(_index).height();
            $expandContainer.eq(_index).css({
              height: `${height}px`,
            });
            $(this).addClass(styles.active);
            $(this).find("span").text(LANG["user_account.my_order.collaspe"]);
          }
        }
      );
    });
  }, [list]);

  React.useEffect(() => {
    getList();
  }, []);
  return (
    <>
      {orderLoading ? (
        <Loading height={400} />
      ) : (
        <div className={styles.container}>
          <div className={styles.title_container}>
            <div>{LANG["user_account.my_order"]}</div>
          </div>
          {list.length < 1 ? (
            <Empyt
              LANG={LANG}
              buttonProps={{
                text: LANG["user_account.my_order.go_to_buy"],
                href: "/",
              }}
            />
          ) : null}
          {list.length > 0 ? (
            <div className={styles.order_list}>
              {list.map((orderItem, orderIndex) => {
                const firstLine = orderItem.order_list?.[0] ?? {};
                const priceUnit =
                  orderItem.price_unit ?? firstLine.priceUnit ?? 100;
                const currencyLabel = firstLine.priceCurrency ?? "";
                const fmtMoney = (value) =>
                  `${currencyLabel} ${formatCurrency(value, priceUnit)}`;
                const shippingFee = Number(orderItem.shipping_fee) || 0;
                const shippingLabel =
                  LANG["store.order_info.express_price"] ||
                  LANG["store.order.express_price"] ||
                  "Shipping";
                let appliedDiscounts = [];
                try {
                  appliedDiscounts = Array.isArray(orderItem.applied_discounts)
                    ? orderItem.applied_discounts
                    : orderItem.applied_discounts
                      ? JSON.parse(orderItem.applied_discounts)
                      : [];
                } catch {
                  appliedDiscounts = [];
                }
                const shippingDiscounts = appliedDiscounts.filter(
                  (item) => item.type === "free_shipping"
                );
                const orderTotal =
                  orderItem.pay_price ??
                  (Number(
                    orderItem.subtotal_after_discount ?? orderItem.total_price
                  ) || 0) + shippingFee;
                const fmtOrderTotal =
                  orderItem.pay_symbol && orderItem.pay_price
                    ? `${orderItem.pay_symbol} ${formatCurrency(
                        orderTotal,
                        priceUnit
                      )}`
                    : fmtMoney(orderTotal);

                return (
                  <div key={orderIndex} className={styles.order_item}>
                    <div className={styles.order_header}>
                      <div className={styles.header_item}>
                        <div className={styles.order_title}>
                          {LANG["user_account.my_order.order_number"]}
                        </div>
                        <div className={styles.order_value}>
                          {orderItem.order_number}
                        </div>
                      </div>
                      <div className={styles.header_item}>
                        <div className={styles.order_title}>
                          {LANG["user_account.my_order.order_time"]}
                        </div>
                        <div className={styles.order_value}>
                          {orderItem.order_time}
                        </div>
                      </div>
                      {orderItem.pay_time ? (
                        <div className={styles.header_item}>
                          <div className={styles.order_title}>
                            {LANG["user_account.my_order.pay_time"]}
                          </div>
                          <div className={styles.order_value}>
                            {orderItem.pay_time}
                          </div>
                        </div>
                      ) : null}
                      {orderItem.deliver_time ? (
                        <div className={styles.header_item}>
                          <div className={styles.order_title}>
                            {LANG["user_account.my_order.deliver_time"]}
                          </div>
                          <div className={styles.order_value}>
                            {orderItem.deliver_time}
                          </div>
                        </div>
                      ) : null}

                      {orderItem.finish_time ? (
                        <div className={styles.header_item}>
                          <div className={styles.order_title}>
                            {LANG["user_account.my_order.finish_time"]}
                          </div>
                          <div className={styles.order_value}>
                            {orderItem.finish_time}
                          </div>
                        </div>
                      ) : null}

                      <div className={styles.header_item}>
                        <div className={styles.order_title}>
                          {LANG["user_account.my_order.pay_way"]}
                        </div>
                        <div className={styles.order_value}>
                          {payMap[orderItem.pay_key]}
                        </div>
                      </div>

                      <div className={styles.header_item}>
                        <div className={styles.order_title}>
                          {LANG["user_account.my_order.order_status"]}
                        </div>
                        <div
                          className={`
                        ${styles.order_value} 
                        ${
                          orderItem.order_status === "status0" ||
                          orderItem.order_status === "status5"
                            ? styles.error
                            : ""
                        }
                        ${
                          orderItem.order_status === "status1"
                            ? styles.yellow
                            : ""
                        }
                        ${
                          orderItem.order_status === "status2"
                            ? styles.blue
                            : ""
                        }
                        ${
                          orderItem.order_status === "status3"
                            ? styles.green
                            : ""
                        }
                        ${
                          orderItem.order_status === "status4"
                            ? styles.black
                            : ""
                        }
                        `}
                        >
                          {orderStatus[orderItem.order_status]}
                        </div>
                      </div>

                      {orderItem.discount ? (
                        <>
                          <div className={styles.header_item}>
                            <div className={styles.order_title}>
                              {LANG["user_account.my_order.order_price"]}
                            </div>
                            <div className={styles.order_value}>
                              {fmtMoney(orderItem.total_price)}
                            </div>
                          </div>
                          <div className={styles.header_item}>
                            <div className={styles.order_title}>
                              {LANG["user_account.my_order.discount"]}
                            </div>
                            <div
                              className={[styles.order_value, styles.red].join(
                                " "
                              )}
                            >
                              {`- ${fmtMoney(orderItem.discount)}`}
                            </div>
                          </div>
                        </>
                      ) : null}

                      {shippingFee > 0 ? (
                        <div className={styles.header_item}>
                          <div className={styles.order_title}>
                            {shippingLabel}
                          </div>
                          <div className={styles.order_value}>
                            {fmtMoney(shippingFee)}
                          </div>
                        </div>
                      ) : null}

                      {shippingDiscounts.map((discountItem, discountIndex) => (
                        <div
                          key={`ship-discount-${discountIndex}`}
                          className={styles.header_item}
                        >
                          <div className={styles.order_title}>
                            {LANG["store.order_info.shipping_discount"] ||
                              "Shipping discount"}
                          </div>
                          <div
                            className={[styles.order_value, styles.red].join(
                              " "
                            )}
                          >
                            {`- ${fmtMoney(Number(discountItem.amount) || 0)}`}
                          </div>
                        </div>
                      ))}

                      {orderItem.pay_price ? (
                        <div className={styles.header_item}>
                          <div className={styles.order_title}>
                            {LANG["user_account.my_order.pay_price"]}
                          </div>
                          <div
                            className={styles.order_value}
                          >{`${orderItem.pay_symbol} ${formatCurrency(
                            orderItem.pay_price,
                            priceUnit
                          )}`}</div>
                        </div>
                      ) : null}
                    </div>
                    <div className={styles.pay_container}>
                      <div className={styles.total_price}>
                        <b> {LANG["user_account.my_order.total_price"]}</b>
                        {fmtOrderTotal}
                      </div>
                      {orderItem.order_status === "status0" ? (
                        <div
                          onClick={() => {
                            if (orderItem.pay_key === "bankTransfer") {
                              window.open(
                                `/order/info?secret=${orderItem.secret}`,
                                "_blank"
                              );
                            }
                            if (orderItem.pay_key === "payPal") {
                              window.open(
                                `/order/info?secret=${orderItem.secret}`,
                                "_blank"
                              );
                            }
                          }}
                          className={styles.insta_pay}
                        >
                          {LANG["user_account.my_order.insta_pay"]}
                        </div>
                      ) : null}
                    </div>

                    <div
                      className={styles.tip}
                      dangerouslySetInnerHTML={{
                        __html: LANG["user_account.my_order.contact_us"],
                      }}
                    />
                    <div className={styles.expand_container}>
                      <div className={styles.expand_height}>
                        <div className={styles.good_list}>
                          <h2>{LANG["user_account.my_order.good_list"]}</h2>
                          {orderItem.order_list.map((goodItem, goodIndex) => {
                            return (
                              <div key={goodIndex} className={styles.good_item}>
                                <div className={styles.product_info}>
                                  <div className={styles.good_img}>
                                    <img
                                      src={goodItem.image}
                                      alt={goodItem.name}
                                    />
                                  </div>
                                  <div className={styles.good_info}>
                                    <div className={styles.good_name}>
                                      {goodItem.name}
                                    </div>
                                    <div className={styles.combo_name}>
                                      {goodItem.comboName}
                                    </div>
                                    <div className={styles.good_option}>
                                      {goodItem.options.map(
                                        (option, optionIndex) => {
                                          return (
                                            <div
                                              key={optionIndex}
                                            >{`${option.name}: ${option.value}`}</div>
                                          );
                                        }
                                      )}
                                    </div>
                                  </div>
                                </div>
                                <div className={styles.product_number}>
                                  <div
                                    className={styles.good_price}
                                  >{`${goodItem.priceSymbol}${formatCurrency(
                                    goodItem.productPrice,
                                    goodItem.priceUnit ?? priceUnit
                                  )}`}</div>
                                  <div className={styles.good_number}>
                                    × {goodItem.productNum}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        <div className={styles.user_info}>
                          <h2>{LANG["user_account.my_order.user_info"]}</h2>
                          {orderItem.first_name ? (
                            <div
                              className={styles.user_item}
                            >{`${orderItem.first_name} ${orderItem.last_name}`}</div>
                          ) : null}
                          {orderItem.phone ? (
                            <div className={styles.user_item}>
                              {orderItem.phone}
                            </div>
                          ) : null}

                          <div className={styles.user_item}>
                            {orderItem.email}
                          </div>
                          {orderItem.address1 ? (
                            <div
                              className={styles.user_item}
                            >{`(${orderItem.zip_code}) ${orderItem.area_text} ${orderItem.address1}`}</div>
                          ) : null}
                          {orderItem.address2 ? (
                            <div className={styles.user_item}>
                              {orderItem.address2}
                            </div>
                          ) : null}
                        </div>
                        {orderItem.user_remark || orderItem.seller_remark ? (
                          <div className={styles.order_remark}>
                            <h2>{LANG["user_account.my_order.order_remark"]}</h2>
                            {orderItem.user_remark ? (
                              <div className={styles.user_item}>
                                <b>
                                  {LANG["user_account.my_order.user_remark"]}{" "}
                                </b>{" "}
                                {orderItem.user_remark}
                              </div>
                            ) : null}
                            {orderItem.seller_remark ? (
                              <div className={styles.user_item}>
                                <b>
                                  {" "}
                                  {LANG["user_account.my_order.saller_remark"]}
                                </b>{" "}
                                {orderItem.address2}
                              </div>
                            ) : null}
                          </div>
                        ) : null}
                      </div>
                    </div>

                    <div className={styles.expand_icon}>
                      <span>{LANG["user_account.my_order.expand"]}</span>
                      <div className={styles.arrow_icon}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : null}
        </div>
      )}
    </>
  );
}
