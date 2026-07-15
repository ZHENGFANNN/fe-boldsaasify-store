/** @format */

"use client";

import styles from "./index.module.scss";
import Api from "../../api";
import React from "react";
import Empyt from "../../../../../components/Empyt";
import Loading from "../../../../../components/Loading";
import { formatCurrency, formatDateTime } from "@/utils";
import readClientArea from "@/utils/readClientArea";
import { useRouter } from "next/navigation";
import { defaultLocale } from "@/config/languageSettings";

// 订单列表精简为卡片：仅展示订单号 / 时间 / 状态 / 首图 + 商品概要 / 合计。
// 详细信息（商品明细、收货信息、备注）统一在 /order/info?secret= 详情页查看。
export default function OrderInfo({ LANG, locale }) {
  const router = useRouter();

  const localeHref = React.useCallback(
    (path) =>
      locale && locale !== defaultLocale ? `/${locale}${path}` : path,
    [locale]
  );

  const orderStatus = React.useMemo(() => {
    return {
      pending_payment:
        LANG["user_account.my_order.await_pay"] || "Pending payment",
      paid: LANG["user_account.my_order.await_deliver"] || "To be delivered",
      shipped: LANG["user_account.my_order.delivered"] || "Shipped",
      delivered: LANG["user_account.my_order.received"] || "Delivered",
      completed: LANG["user_account.my_order.finished"] || "Completed",
      cancelled: LANG["user_account.my_order.cancelled"] || "Cancelled",
      refunding: LANG["user_account.my_order.refunding"] || "Refunding",
      refunded: LANG["user_account.my_order.refunded"] || "Refunded",
      closed: LANG["user_account.my_order.closed"] || "Closed",
    };
  }, [LANG]);

  const orderStatusColor = React.useMemo(() => {
    return {
      pending_payment: styles.error,
      paid: styles.yellow,
      shipped: styles.blue,
      delivered: styles.blue,
      completed: styles.green,
      cancelled: styles.black,
      refunding: styles.yellow,
      refunded: styles.black,
      closed: styles.black,
    };
  }, []);

  const [orderLoading, setOrderLoading] = React.useState(true);
  const [list, setList] = React.useState([]);
  const area = readClientArea();
  const fmtDateTime = React.useCallback(
    (time) => formatDateTime({ time, locale, area }),
    [locale, area]
  );

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
    // 首屏拉取订单列表；getList 内部 setState 属预期同步，豁免该规则。
    /* eslint-disable-next-line react-hooks/set-state-in-effect */
    getList();
  }, [getList]);

  const goDetail = React.useCallback(
    (orderItem) => {
      if (!orderItem?.secret) return;
      // 待支付：新窗口打开去支付；其余：当前页跳详情。
      if (orderItem.order_status === "pending_payment") {
        window.open(localeHref(`/order/info?secret=${orderItem.secret}`), "_blank");
        return;
      }
      router.push(localeHref(`/order/info?secret=${orderItem.secret}`));
    },
    [router, localeHref]
  );

  if (orderLoading) {
    return <Loading height={400} />;
  }

  return (
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
      ) : (
        <div className={styles.order_list}>
          {list.map((orderItem, orderIndex) => {
            const goods = orderItem.order_list ?? [];
            const firstLine = goods[0] ?? {};
            const priceUnit = orderItem.price_unit ?? firstLine.priceUnit ?? 100;
            const orderTotal =
              orderItem.pay_price ??
              (Number(
                orderItem.subtotal_after_discount ?? orderItem.total_price
              ) || 0) + (Number(orderItem.shipping_fee) || 0);
            const totalLabel =
              orderItem.pay_symbol && orderItem.pay_price
                ? `${orderItem.pay_symbol} ${formatCurrency(orderTotal, priceUnit)}`
                : `${firstLine.priceCurrency ?? ""} ${formatCurrency(
                    orderTotal,
                    priceUnit
                  )}`;

            return (
              <button
                type="button"
                key={orderIndex}
                className={styles.order_card}
                onClick={() => goDetail(orderItem)}
              >
                <div className={styles.card_head}>
                  <span className={styles.no_value}>
                    {orderItem.order_number}
                  </span>
                  <span
                    className={`${styles.status} ${
                      orderStatusColor[orderItem.order_status] || ""
                    }`}
                  >
                    {orderStatus[orderItem.order_status]}
                  </span>
                </div>

                <div className={styles.card_body}>
                  {firstLine.image ? (
                    <div className={styles.thumb}>
                      <img src={firstLine.image} alt={firstLine.name || ""} />
                      {goods.length > 1 ? (
                        <span className={styles.thumb_badge}>
                          ×{goods.length}
                        </span>
                      ) : null}
                    </div>
                  ) : null}
                  <div className={styles.summary}>
                    <div className={styles.summary_name}>{firstLine.name || ""}</div>
                    {firstLine.comboName ? (
                      <div className={styles.summary_sub}>
                        {firstLine.comboName}
                      </div>
                    ) : null}
                  </div>
                  <div className={styles.card_total}>{totalLabel}</div>
                </div>

                <div className={styles.card_foot}>
                  <span className={styles.foot_date}>
                    {fmtDateTime(orderItem.order_time)}
                  </span>
                  <span className={styles.view_detail}>
                    {orderItem.order_status === "pending_payment"
                      ? LANG["user_account.my_order.insta_pay"]
                      : LANG["user_account.my_order.view_detail"] ||
                        LANG["store.order_info.order_info"] ||
                        "View details"}
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M9 18l6-6-6-6" />
                    </svg>
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
