"use client";

import React from "react";
import { useForm } from "react-hook-form";
import styles from "./index.module.scss";
import Api from "../../api";
import Input from "@/components/Form/FormInput";
import Textarea from "@/components/Form/FormTextArea";
import ShowTipModal from "@/components/Modal/ShowTipModal";
import Loading from "@/components/Loading";
import Empyt from "@/components/Empyt";

// 售后类型枚举（与后端 afterServiceTypes 白名单一致）
const TYPE_KEYS = ["return", "refund", "exchange", "repair", "other"];

// 文案兜底：后端语言包暂未配置 user_account.after_sale.* 时用英文兜底
const T = (LANG, key, fallback) => LANG?.[key] || fallback;

export default function AfterSaleInfo({ LANG }) {
  const tipRef = React.useRef(null);
  const [loading, setLoading] = React.useState(true);
  const [list, setList] = React.useState([]);
  const [orders, setOrders] = React.useState([]);
  const [show, setShow] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm();

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
      pending: T(LANG, "user_account.after_sale.status.pending", "Pending"),
      processing: T(
        LANG,
        "user_account.after_sale.status.processing",
        "Processing"
      ),
      resolved: T(LANG, "user_account.after_sale.status.resolved", "Resolved"),
      rejected: T(LANG, "user_account.after_sale.status.rejected", "Rejected"),
      closed: T(LANG, "user_account.after_sale.status.closed", "Closed"),
    }),
    [LANG]
  );

  const getList = React.useCallback(() => {
    setLoading(true);
    Api.getAfterServiceList()
      .then((res) => {
        if (res.code !== 0) throw new Error("code!==0");
        setList(res.data?.list ?? []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const getOrders = React.useCallback(() => {
    Api.getOrderList()
      .then((res) => {
        if (res.code !== 0) return;
        setOrders(res.data?.list ?? []);
      })
      .catch(() => {});
  }, []);

  React.useEffect(() => {
    getList();
    getOrders();
  }, []);

  const onSubmit = async (values) => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const selected = orders.find(
        (o) => String(o.secret) === String(values.order)
      );
      const res = await Api.createAfterService({
        order_number: selected?.order_number || "",
        type: values.type,
        description: values.description,
      });
      if (res.code !== 0) throw new Error("code!==0");
      reset();
      setShow(false);
      tipRef.current?.show({
        text: T(
          LANG,
          "user_account.after_sale.submit_success",
          "Your request has been submitted."
        ),
        type: "success",
      });
      getList();
    } catch (err) {
      tipRef.current?.show({
        text: T(
          LANG,
          "user_account.after_sale.submit_fail",
          "Submission failed. Please try again."
        ),
        type: "error",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.title_container}>
        <div>{T(LANG, "user_account.after_sale", "After-Sales Service")}</div>
        <button className={styles.create_btn} onClick={() => setShow(true)}>
          {T(LANG, "user_account.after_sale.create", "New Request")}
        </button>
      </div>

      {/* CONTENT_PLACEHOLDER */}
      {loading ? (
        <Loading height={300} />
      ) : list.length < 1 ? (
        <Empyt LANG={LANG} />
      ) : (
        <div className={styles.record_list}>
          {list.map((item) => (
            <div key={item.id} className={styles.record_item}>
              <div className={styles.record_head}>
                <span className={styles.record_type}>
                  {typeMap[item.type] || item.type}
                </span>
                <span
                  className={`${styles.record_status} ${styles[item.status] || ""}`}
                >
                  {statusMap[item.status] || item.status}
                </span>
              </div>
              {item.order_number ? (
                <div className={styles.record_order}>
                  {T(LANG, "user_account.after_sale.order", "Order")}:{" "}
                  {item.order_number}
                </div>
              ) : null}
              <div className={styles.record_desc}>{item.description}</div>
              {item.seller_reply ? (
                <div className={styles.record_reply}>
                  <b>
                    {T(LANG, "user_account.after_sale.seller_reply", "Reply")}:
                  </b>{" "}
                  {item.seller_reply}
                </div>
              ) : null}
              <div className={styles.record_time}>{item.created_time}</div>
            </div>
          ))}
        </div>
      )}

      <div className={`${styles.modal} ${show ? styles.show : ""}`}>
        <div className={styles.modal_content}>
          <h2>{T(LANG, "user_account.after_sale.create", "New Request")}</h2>
          <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
            <div className={styles.form_item}>
              <label className={styles.form_label}>
                {T(LANG, "user_account.after_sale.order", "Order")}
              </label>
              <div className={styles.select_wrap}>
                <select
                  className={`${styles.select} ${errors.order ? styles.error : ""}`}
                  defaultValue=""
                  {...register("order")}
                >
                  <option value="">
                    {T(
                      LANG,
                      "user_account.after_sale.order_optional",
                      "Select an order (optional)"
                    )}
                  </option>
                  {orders.map((o) => (
                    <option key={o.secret} value={o.secret}>
                      {o.order_number}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className={styles.form_item}>
              <label className={styles.form_label}>
                {T(LANG, "user_account.after_sale.type", "Type")} *
              </label>
              <div className={styles.select_wrap}>
                <select
                  className={`${styles.select} ${errors.type ? styles.error : ""}`}
                  defaultValue=""
                  {...register("type", { required: true })}
                >
                  <option value="" disabled>
                    {T(
                      LANG,
                      "user_account.after_sale.type_placeholder",
                      "Select a type"
                    )}
                  </option>
                  {TYPE_KEYS.map((k) => (
                    <option key={k} value={k}>
                      {typeMap[k]}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className={styles.form_item}>
              <Textarea
                label={T(
                  LANG,
                  "user_account.after_sale.description",
                  "Describe your issue"
                )}
                error={
                  errors.description
                    ? T(
                        LANG,
                        "user_account.after_sale.description_require",
                        "Please describe your issue"
                      )
                    : ""
                }
                inputProps={{
                  ...register("description", {
                    required: true,
                    maxLength: 1000,
                  }),
                }}
              />
            </div>

            <div className={styles.form_actions}>
              <button
                type="button"
                className={styles.cancel_btn}
                onClick={() => {
                  reset();
                  setShow(false);
                }}
              >
                {T(LANG, "user_account.after_sale.cancel", "Cancel")}
              </button>
              <button
                type="submit"
                className={styles.submit_btn}
                disabled={submitting}
              >
                {T(LANG, "user_account.after_sale.submit", "Submit")}
              </button>
            </div>
          </form>
        </div>
      </div>

      <ShowTipModal ref={tipRef} />
    </div>
  );
}
