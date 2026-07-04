"use client";

import React from "react";
import styles from "./index.module.scss";
import { getMyOrders } from "./api";

// 订单状态 -> 文案，取自 FAQ_COPY.orderStatus（按 locale 解析）；缺失回退状态码
export function getOrderStatusText(copy, status) {
  const map = copy?.orderStatus || {};
  return map[status] || status || "";
}

// secret 是 be-order-service 用 HS256 JWT 包裹的 { secret: erp_order_detail.id }；
// 列表接口不直出原始 id，这里只解码 payload（不验签，后端会再校验归属）取订单主键。
function decodeOrderIdFromSecret(secret) {
  if (!secret || typeof secret !== "string") return 0;
  const parts = secret.split(".");
  if (parts.length < 2) return 0;
  try {
    let payload = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    while (payload.length % 4) payload += "=";
    const json =
      typeof atob === "function"
        ? atob(payload)
        : Buffer.from(payload, "base64").toString("binary");
    const claims = JSON.parse(json);
    const raw = claims?.secret;
    const n = Number(raw);
    return Number.isFinite(n) && n > 0 ? n : 0;
  } catch (err) {
    return 0;
  }
}

// 取订单首件商品（用于卡片首图/标题/快照）
function firstItemOf(order) {
  const list = Array.isArray(order?.order_list) ? order.order_list : [];
  return list[0] || null;
}

// 发送时最小快照：状态/币种符号/总价/首图/标题，坐席侧实时面板会另查最新值
export function buildOrderSnapshot(order) {
  const first = firstItemOf(order);
  return {
    order_no: order?.order_number || "",
    order_status: order?.order_status || "",
    pay_symbol: order?.pay_symbol || (first?.priceSymbol ?? ""),
    pay_price: order?.pay_price ?? "",
    total_price: order?.total_price ?? "",
    currency: first?.priceCurrency || "",
    title: first?.name || "",
    image: first?.image || "",
    item_count: Array.isArray(order?.order_list) ? order.order_list.length : 0,
  };
}

export default function OrderPicker({ copy, onPick, onClose }) {
  const [loading, setLoading] = React.useState(true);
  const [list, setList] = React.useState([]);

  React.useEffect(() => {
    let cancelled = false;
    getMyOrders()
      .then((res) => {
        if (cancelled) return;
        if (res?.code === 0 && Array.isArray(res.data?.list)) {
          setList(res.data.list);
        } else {
          setList([]);
        }
      })
      .catch(() => {
        if (!cancelled) setList([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handlePick = (order) => {
    const orderId = decodeOrderIdFromSecret(order?.secret);
    if (!orderId) return;
    onPick?.({
      order_id: orderId,
      order_no: order?.order_number || "",
      snapshot: buildOrderSnapshot(order),
    });
  };

  return (
    <div className={styles.orderPickerOverlay} role="dialog" aria-modal="true">
      <div className={styles.orderPickerSheet}>
        <div className={styles.orderPickerHead}>
          <span className={styles.orderPickerTitle}>
            {copy?.orderPickerTitle || "Share an order"}
          </span>
          <button
            type="button"
            className={styles.orderPickerClose}
            aria-label="Close"
            onClick={onClose}
          >
            ×
          </button>
        </div>
        <div className={styles.orderPickerBody}>
          {loading ? (
            <div className={styles.orderPickerHint}>
              <span className={styles.loadingDots} aria-label="Loading">
                <span />
                <span />
                <span />
              </span>
            </div>
          ) : list.length === 0 ? (
            <div className={styles.orderPickerEmpty}>
              {copy?.orderPickerEmpty || "No orders to share yet."}
            </div>
          ) : (
            <ul className={styles.orderPickerList}>
              {list.map((order, idx) => {
                const first = firstItemOf(order);
                const orderId = decodeOrderIdFromSecret(order?.secret);
                // 与共享卡片/快照(buildOrderSnapshot)同口径：用原价 total_price，勿减折扣，
                // 否则选择器显示折后价、分享出去的卡片显示原价，金额对不上。
                const total = order?.total_price;
                const currency = first?.priceCurrency || "";
                return (
                  <li
                    key={order?.order_number || idx}
                    className={`${styles.orderPickerItem} ${
                      orderId ? "" : styles.orderPickerItemDisabled
                    }`}
                  >
                    <button
                      type="button"
                      className={styles.orderPickerItemBtn}
                      disabled={!orderId}
                      onClick={() => handlePick(order)}
                    >
                      {first?.image ? (
                        <img
                          className={styles.orderPickerThumb}
                          src={first.image}
                          alt={first?.name || ""}
                        />
                      ) : (
                        <span className={styles.orderPickerThumb} />
                      )}
                      <span className={styles.orderPickerInfo}>
                        <span className={styles.orderPickerNo}>
                          {order?.order_number}
                        </span>
                        <span className={styles.orderPickerName}>
                          {first?.name || ""}
                        </span>
                        <span className={styles.orderPickerMeta}>
                          <span className={styles.orderPickerStatus}>
                            {getOrderStatusText(copy, order?.order_status)}
                          </span>
                          {total !== undefined && total !== "" ? (
                            <span className={styles.orderPickerPrice}>
                              {`${currency} ${total}`}
                            </span>
                          ) : null}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
