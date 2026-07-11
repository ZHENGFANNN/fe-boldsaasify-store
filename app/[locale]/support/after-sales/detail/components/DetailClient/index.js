"use client";

import React from "react";
import Link from "next/link";
import Cookies from "js-cookie";
import styles from "../../page.module.scss";
import Api from "../../../api";
import { getJsonData } from "@/utils";
import { defaultLocale } from "@/config/languageSettings";
import Loading from "@/components/Loading";
import AuthRedirectGuard from "@/components/AuthRedirectGuard";

const T = (LANG, key, fallback) => LANG?.[key] || fallback;

const localeHref = (path, locale) =>
  locale && locale !== defaultLocale ? `/${locale}${path}` : path;

// 工单 status → 进度步（1..4）；rejected 单独展示驳回态
const STATUS_STEP = {
  pending: 1,
  processing: 2,
  resolved: 3,
  closed: 4,
};

// 单条信息行（value 为空时不渲染）
function InfoRow({ label, value }) {
  if (!value) return null;
  return (
    <div className={styles.info_row}>
      <span className={styles.info_label}>{label}</span>
      <span className={styles.info_value}>{value}</span>
    </div>
  );
}

export default function DetailClient({ LANG, locale }) {
  const [isLogin, setIsLogin] = React.useState(null);
  const [redirectPath, setRedirectPath] = React.useState(
    "/support/after-sales/detail"
  );
  const [serviceNo, setServiceNo] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [data, setData] = React.useState(null);
  const [error, setError] = React.useState(false);

  // cookie/URL 仅挂载后可读（SSR 无 window），故在 effect 内同步 setState。
  /* eslint-disable react-hooks/set-state-in-effect */
  React.useEffect(() => {
    setIsLogin(!!Cookies.get("token"));
    const search = new URLSearchParams(window.location.search);
    setServiceNo(search.get("no"));
    setRedirectPath(`${window.location.pathname}${window.location.search}`);
  }, []);

  React.useEffect(() => {
    if (isLogin === null) return;
    if (!isLogin) {
      setLoading(false);
      return;
    }
    if (!serviceNo) {
      setLoading(false);
      setError(true);
      return;
    }
    setLoading(true);
    Api.getAfterServiceDetail(serviceNo)
      .then((res) => {
        if (res.code !== 0) throw new Error("code!==0");
        setData(res.data || null);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [isLogin, serviceNo]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const typeLabelMap = React.useMemo(
    () => ({
      refund: T(LANG, "user_account.after_sale.type.refund", "Refund"),
      return_refund: T(
        LANG,
        "user_account.after_sale.type.return_refund",
        "Return & Refund"
      ),
      repair: T(LANG, "user_account.after_sale.type.repair", "Repair"),
      exchange: T(LANG, "user_account.after_sale.type.exchange", "Exchange"),
    }),
    [LANG]
  );

  const steps = React.useMemo(
    () => [
      T(LANG, "user_account.after_sale.progress.submitted", "Request Submitted"),
      T(LANG, "user_account.after_sale.progress.processing", "Processing"),
      T(LANG, "user_account.after_sale.progress.resolved", "Resolved"),
      T(LANG, "user_account.after_sale.progress.completed", "Completed"),
    ],
    [LANG]
  );

  if (isLogin === null || loading) {
    return <Loading height={400} />;
  }

  if (!isLogin) {
    return <AuthRedirectGuard LANG={LANG} redirectPath={redirectPath} />;
  }

  if (error || !data) {
    return (
      <div className={styles.empty}>
        <p>
          {T(
            LANG,
            "user_account.after_sale.not_found",
            "This request could not be found."
          )}
        </p>
        <Link
          className={styles.back_link}
          href={localeHref("/support/after-sales/create", locale)}
        >
          {T(LANG, "user_account.after_sale.create", "New Request")}
        </Link>
      </div>
    );
  }

  const status = data.status;
  const isRejected = status === "rejected";
  const currentStep = STATUS_STEP[status] || 1;

  const media = Array.isArray(data.media) ? data.media : getJsonData(data.media);
  const reportType = data.report_type;

  return (
    <div className={styles.detail}>
      <h1 className={styles.page_title}>
        {T(
          LANG,
          "user_account.after_sale.detail_title",
          "After-Sales Request"
        )}
      </h1>

      {isRejected ? (
        <div className={styles.rejected_banner}>
          {T(
            LANG,
            "user_account.after_sale.status.rejected_tip",
            "Your request has been rejected."
          )}
        </div>
      ) : null}

      {/* ---------- 进度条 ---------- */}
      <div className={styles.progress}>
        {steps.map((label, i) => {
          const no = i + 1;
          const done = !isRejected && no < currentStep;
          const active = !isRejected && no === currentStep;
          return (
            <React.Fragment key={no}>
              <div
                className={`${styles.p_step} ${active ? styles.active : ""} ${
                  done ? styles.done : ""
                }`}
              >
                <span className={styles.p_dot}>{no}</span>
                <span className={styles.p_label}>{label}</span>
              </div>
              {i < steps.length - 1 ? (
                <div
                  className={`${styles.p_line} ${
                    !isRejected && no < currentStep ? styles.done : ""
                  }`}
                />
              ) : null}
            </React.Fragment>
          );
        })}
      </div>

      {/* ---------- 提单成功：用户填写内容 ---------- */}
      <div className={styles.card}>
        <div className={styles.card_title}>
          {T(
            LANG,
            "user_account.after_sale.progress.submitted",
            "Request Submitted"
          )}
        </div>

        {/* 提单方式与订单/产品信息 */}
        <div className={styles.section}>
          <div className={styles.section_head}>
            {reportType === "order"
              ? T(
                  LANG,
                  "user_account.after_sale.method.order",
                  "Select from my orders"
                )
              : T(
                  LANG,
                  "user_account.after_sale.method.product",
                  "Select a product"
                )}
          </div>
          <InfoRow
            label={T(LANG, "user_account.after_sale.product", "Product")}
            value={data.product_name}
          />
          {reportType === "order" ? (
            <InfoRow
              label={T(
                LANG,
                "user_account.my_order.order_number",
                "Order No."
              )}
              value={data.order_number}
            />
          ) : (
            <>
              <InfoRow
                label={T(
                  LANG,
                  "user_account.after_sale.purchase_time",
                  "Purchase date"
                )}
                value={data.purchase_time}
              />
              <InfoRow
                label={T(
                  LANG,
                  "user_account.after_sale.purchase_channel",
                  "Purchase channel"
                )}
                value={data.purchase_channel}
              />
              <InfoRow
                label={T(
                  LANG,
                  "user_account.after_sale.purchase_order_no",
                  "Purchase order number"
                )}
                value={data.purchase_order_no}
              />
            </>
          )}
        </div>

        {/* 售后方式 */}
        <div className={styles.section}>
          <div className={styles.section_head}>
            {T(
              LANG,
              "user_account.after_sale.service_type",
              "Service type"
            )}
          </div>
          <div className={styles.type_badge}>
            {typeLabelMap[data.type] || data.type}
          </div>
        </div>

        {/* 描述 */}
        {data.description ? (
          <div className={styles.section}>
            <div className={styles.section_head}>
              {T(
                LANG,
                "user_account.after_sale.description",
                "Description"
              )}
            </div>
            <div className={styles.description}>{data.description}</div>
          </div>
        ) : null}

        {/* 媒体 */}
        {media && media.length ? (
          <div className={styles.section}>
            <div className={styles.section_head}>
              {T(LANG, "user_account.after_sale.media", "Photos / Videos")}
            </div>
            <div className={styles.media_grid}>
              {media.map((m, i) =>
                m.type === "video" ? (
                  <video
                    key={i}
                    className={styles.media_item}
                    src={m.url}
                    controls
                  />
                ) : /^https?:\/\//i.test((m.url || "").trim()) ? (
                  <a
                    key={i}
                    className={styles.media_item}
                    href={m.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <img src={m.url} alt={m.name || `media-${i}`} />
                  </a>
                ) : (
                  <img
                    key={i}
                    className={styles.media_item}
                    src={m.url}
                    alt={m.name || `media-${i}`}
                  />
                )
              )}
            </div>
          </div>
        ) : null}

        {/* 联系方式 */}
        <div className={styles.section}>
          <div className={styles.section_head}>
            {T(LANG, "user_account.after_sale.contact", "Contact")}
          </div>
          <InfoRow
            label={T(LANG, "user_account.after_sale.contact.email", "Email")}
            value={data.contact_email}
          />
          <InfoRow
            label={T(LANG, "user_account.after_sale.contact.phone", "Phone")}
            value={data.contact_phone}
          />
        </div>
      </div>

      {/* ---------- 商家回复 ---------- */}
      {data.seller_reply ? (
        <div className={styles.card}>
          <div className={styles.card_title}>
            {T(
              LANG,
              "user_account.after_sale.seller_reply",
              "Reply from our team"
            )}
          </div>
          <div className={styles.description}>{data.seller_reply}</div>
        </div>
      ) : null}
    </div>
  );
}
