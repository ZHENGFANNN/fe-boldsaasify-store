"use client";

import React from "react";
import { useRouter } from "next/navigation";
import styles from "./index.module.scss";
import Api from "../../api";
import Loading from "@/components/Loading";
import Empyt from "@/components/Empyt";

// 售后类型枚举（与后端 afterServiceTypes 白名单一致）
const TYPE_KEYS = ["return", "refund", "exchange", "repair", "other"];

// 筛选桶：进行中 = pending + processing，历史 = resolved + rejected + cancelled
const FILTER_STATUS = {
  active: ["pending", "processing"],
  history: ["resolved", "rejected", "cancelled"],
};

// 文案兜底：后端语言包暂未配置 user_account.after_sale.* 时用英文兜底
const T = (LANG, key, fallback) => LANG?.[key] || fallback;

export default function AfterSaleInfo({ LANG, filter = "all" }) {
  const router = useRouter();
  const [loading, setLoading] = React.useState(true);
  const [list, setList] = React.useState([]);

  const typeMap = React.useMemo(
    () => ({
      return: T(LANG, "user_account.after_sale.type.return", "Return"),
      refund: T(LANG, "user_account.after_sale.type.refund", "Refund"),
      exchange: T(LANG, "user_account.after_sale.type.exchange", "Exchange"),
      repair: T(LANG, "user_account.after_sale.type.repair", "Repair"),
      other: T(LANG, "user_account.after_sale.type.other", "Other"),
    }),
    [LANG]
  );

  const statusMap = React.useMemo(
    () => ({
      pending: T(LANG, "user_account.after_sale.status.pending", "Submitted"),
      processing: T(
        LANG,
        "user_account.after_sale.status.processing",
        "Processing"
      ),
      resolved: T(LANG, "user_account.after_sale.status.resolved", "Completed"),
      rejected: T(LANG, "user_account.after_sale.status.rejected", "Rejected"),
      cancelled: T(
        LANG,
        "user_account.after_sale.status.cancelled",
        "Cancelled"
      ),
    }),
    [LANG]
  );

  React.useEffect(() => {
    setLoading(true);
    Api.getAfterServiceList()
      .then((res) => {
        if (res.code !== 0) throw new Error("code!==0");
        setList(res.data?.list ?? []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filteredList = React.useMemo(() => {
    const bucket = FILTER_STATUS[filter];
    if (!bucket) return list;
    return list.filter((item) => bucket.includes(item.status));
  }, [list, filter]);

  if (loading) return <Loading height={300} />;
  if (filteredList.length < 1) return <Empyt LANG={LANG} />;

  return (
    <div className={styles.record_list}>
      {filteredList.map((item) => (
        <div
          key={item.id}
          className={styles.record_item}
          onClick={() =>
            router.push(`/support/after-sales/detail?no=${item.service_no}`)
          }
        >
          <div className={styles.record_head}>
            <span className={styles.record_title}>
              {T(LANG, "user_account.after_sale.order", "Order")}:{" "}
              {item.service_no}
            </span>
            <span
              className={`${styles.record_status} ${styles[item.status] || ""}`}
            >
              {statusMap[item.status] || item.status}
            </span>
          </div>
          <div className={styles.record_meta}>
            <span className={styles.record_type}>
              {typeMap[item.type] || item.type}
            </span>
            {item.description ? (
              <>
                <span className={styles.record_dot} aria-hidden="true">
                  ·
                </span>
                <span className={styles.record_desc}>{item.description}</span>
              </>
            ) : null}
          </div>
          <div className={styles.record_time}>{item.created_time}</div>
        </div>
      ))}
    </div>
  );
}
