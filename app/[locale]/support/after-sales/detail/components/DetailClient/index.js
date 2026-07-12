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
import ShowTipModal from "@/components/Modal/ShowTipModal";
import ProgressSteps from "./parts/ProgressSteps";
import ServiceInfoCard from "./parts/ServiceInfoCard";
import ShipmentForm from "./parts/ShipmentForm";
import CancelledBanner from "./parts/CancelledBanner";
import WarrantyNote from "./parts/WarrantyNote";

// —— 常量 —— //
const T = (LANG, key, fallback) => LANG?.[key] || fallback;

const localeHref = (path, locale) =>
  locale && locale !== defaultLocale ? `/${locale}${path}` : path;

// 6 步进度节点定义（对齐 dashboard-service afterServiceStageOrder / ERP common.js after_service_progress_stages）。
const PROGRESS_STAGES = [
  { key: "shipped", column: "shipped_at", labelKey: "user_account.after_sale.progress.shipped", labelFallback: "Shipped" },
  { key: "received", column: "received_at", labelKey: "user_account.after_sale.progress.received", labelFallback: "Awaiting Arrival" },
  { key: "plan_confirmed", column: "plan_confirmed_at", labelKey: "user_account.after_sale.progress.plan_confirmed", labelFallback: "Confirming Plan" },
  { key: "paid", column: "paid_at", labelKey: "user_account.after_sale.progress.paid", labelFallback: "Awaiting Payment" },
  { key: "executed", column: "executed_at", labelKey: "user_account.after_sale.progress.executed", labelFallback: "Plan Execution" },
  { key: "delivered", column: "delivered_at", labelKey: "user_account.after_sale.progress.delivered", labelFallback: "Ready to Ship" },
];

// 老工单简易 3 步映射（type=refund 或 status ∈ 老态 {processing, closed} 且无节点时间戳时使用）。
const LEGACY_STEP_STATUS = {
  pending: 1,
  processing: 2,
  resolved: 3,
  closed: 3,
};

const TERMINAL_STATUS = new Set(["cancelled", "resolved", "closed", "rejected"]);

// 判定是否需要走 6 步 flow（type 非 refund + 至少一个进度节点时间戳 or 状态已进入 shipped 之后）。
function shouldUseSixStep(data) {
  if (!data) return false;
  if (data.type === "refund") return false;
  return true;
}

// 把详情数据转成 6 步（含时间戳），供 ProgressSteps 直接消费。
function buildSixSteps(data, LANG) {
  const timestamps = PROGRESS_STAGES.map((s) => data[s.column]);
  const lastDoneIdx = timestamps.reduce((acc, v, i) => (v ? i : acc), -1);
  return PROGRESS_STAGES.map((s, i) => ({
    title: T(LANG, s.labelKey, s.labelFallback),
    time: timestamps[i] ? formatDateTime(timestamps[i]) : "",
    done: i <= lastDoneIdx,
    current: i === lastDoneIdx + 1 && !TERMINAL_STATUS.has(data.status),
  }));
}

// 老工单 3 步降级视图。
function buildLegacySteps(data, LANG) {
  const step = LEGACY_STEP_STATUS[data.status] || 1;
  return [
    { title: T(LANG, "user_account.after_sale.progress.submitted", "Submitted") },
    { title: T(LANG, "user_account.after_sale.progress.processing", "Processing") },
    { title: T(LANG, "user_account.after_sale.progress.resolved", "Resolved") },
  ].map((it, i) => ({
    ...it,
    done: i + 1 < step,
    current: i + 1 === step && !TERMINAL_STATUS.has(data.status),
  }));
}

function formatDateTime(s) {
  if (!s) return "";
  // "2026-07-12T13:33:00Z" → "2026-07-12 13:33"
  const raw = String(s);
  if (raw.length >= 16) return raw.slice(0, 10) + " " + raw.slice(11, 16);
  return raw.slice(0, 10);
}

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
  const [expanded, setExpanded] = React.useState(true);
  const tipRef = React.useRef(null);

  // cookie/URL 仅挂载后可读（SSR 无 window），故在 effect 内同步 setState。
  /* eslint-disable react-hooks/set-state-in-effect */
  React.useEffect(() => {
    setIsLogin(!!Cookies.get("token"));
    const search = new URLSearchParams(window.location.search);
    setServiceNo(search.get("no"));
    setRedirectPath(`${window.location.pathname}${window.location.search}`);
  }, []);

  const refresh = React.useCallback(() => {
    if (!serviceNo) return;
    setLoading(true);
    Api.getAfterServiceDetail(serviceNo)
      .then((res) => {
        if (res.code !== 0) throw new Error("code!==0");
        setData(res.data || null);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [serviceNo]);

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
    refresh();
  }, [isLogin, serviceNo, refresh]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const toast = React.useCallback((text, ok) => {
    tipRef.current?.show({ text, type: ok ? "success" : "error" });
  }, []);

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
  const isCancelled = status === "cancelled";
  const isRejected = status === "rejected";
  const isTerminal = TERMINAL_STATUS.has(status);
  const useSixStep = shouldUseSixStep(data);
  const canEditShipment = !isTerminal && !data.received_at;

  const media = Array.isArray(data.media) ? data.media : getJsonData(data.media);
  const reportType = data.report_type;

  const typeLabelMap = {
    refund: T(LANG, "user_account.after_sale.type.refund", "Refund"),
    return_refund: T(LANG, "user_account.after_sale.type.return_refund", "Return & Refund"),
    repair: T(LANG, "user_account.after_sale.type.repair", "Repair"),
    exchange: T(LANG, "user_account.after_sale.type.exchange", "Exchange"),
    return: T(LANG, "user_account.after_sale.type.return", "Return"),
    other: T(LANG, "user_account.after_sale.type.other", "Other"),
  };

  return (
    <div className={styles.detail}>
      {/* 顶部标题条：售后服务进度 + 右上折叠箭头 */}
      <div className={styles.detail_header}>
        <h1 className={styles.detail_title}>
          {T(
            LANG,
            "user_account.after_sale.progress_title",
            "After-Sales Progress"
          )}
        </h1>
        <button
          type="button"
          className={styles.collapse_btn}
          onClick={() => setExpanded((v) => !v)}
          aria-label={
            expanded
              ? T(LANG, "user_account.after_sale.collapse", "Collapse")
              : T(LANG, "user_account.after_sale.expand", "Expand")
          }
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path
              d={expanded ? "M8 8l8 8M8 16l8-8" : "M17 7L7 17M7 7l10 10"}
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>

      {expanded ? (
        <>
          {/* 已取消：红色卡片替代进度条 */}
          {isCancelled ? (
            <CancelledBanner
              reason={data.cancel_reason}
              LANG={LANG}
              T={T}
            />
          ) : isRejected ? (
            <div className={styles.rejected_banner}>
              {T(
                LANG,
                "user_account.after_sale.status.rejected_tip",
                "Your request has been rejected."
              )}
              {data.seller_reply ? (
                <div className={styles.rejected_reason}>{data.seller_reply}</div>
              ) : null}
            </div>
          ) : (
            <ProgressSteps
              steps={
                useSixStep
                  ? buildSixSteps(data, LANG)
                  : buildLegacySteps(data, LANG)
              }
            />
          )}

          {/* 服务信息 */}
          <ServiceInfoCard
            data={data}
            editable={!isTerminal}
            LANG={LANG}
            T={T}
            onUpdate={refresh}
            toast={toast}
          />

          {/* 产品信息 */}
          <div className={styles.info_card}>
            <div className={styles.section_title}>
              {T(LANG, "user_account.after_sale.product_title", "Product Info")}
            </div>
            <div className={styles.info_row_lg}>
              <span className={styles.info_label}>
                {T(LANG, "user_account.after_sale.product_model", "Model")}
              </span>
              <span className={styles.info_value}>
                {data.product_name || "-"}
              </span>
            </div>
            {data.description ? (
              <div className={styles.info_row_lg}>
                <span className={styles.info_label}>
                  {T(
                    LANG,
                    "user_account.after_sale.reason",
                    "Reason"
                  )}
                </span>
                <span className={styles.info_value}>{data.description}</span>
              </div>
            ) : null}
            <div className={styles.info_row_lg}>
              <span className={styles.info_label}>
                {T(LANG, "user_account.after_sale.service_type", "Service type")}
              </span>
              <span className={styles.type_badge}>
                {typeLabelMap[data.type] || data.type}
              </span>
            </div>
            {reportType === "order" && data.order_number ? (
              <InfoRow
                label={T(
                  LANG,
                  "user_account.my_order.order_number",
                  "Order No."
                )}
                value={data.order_number}
              />
            ) : null}
          </div>

          {/* 物流回寄：非取消/非终态且未签收时显示编辑表单；签收后展示只读 */}
          {useSixStep && !isCancelled && !isRejected ? (
            <ShipmentForm
              data={data}
              editable={canEditShipment}
              LANG={LANG}
              T={T}
              onSubmitted={refresh}
              toast={toast}
            />
          ) : null}

          {/* 售后中心回寄物流（第 6 步落成后展示） */}
          {data.return_express_no ? (
            <div className={styles.info_card}>
              <div className={styles.section_title}>
                {T(
                  LANG,
                  "user_account.after_sale.return_shipping_title",
                  "Return Shipping"
                )}
              </div>
              <InfoRow
                label={T(LANG, "user_account.after_sale.courier", "Courier")}
                value={data.return_express_company}
              />
              <InfoRow
                label={T(LANG, "user_account.after_sale.tracking_no", "Tracking No.")}
                value={data.return_express_no}
              />
              <InfoRow
                label={T(LANG, "user_account.after_sale.delivered_at", "Shipped at")}
                value={formatDateTime(data.delivered_at)}
              />
            </div>
          ) : null}

          {/* 媒体附件 */}
          {media && media.length ? (
            <div className={styles.info_card}>
              <div className={styles.section_title}>
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

          {/* 保修说明卡（除已取消/退款仅退款外都展示） */}
          {useSixStep ? <WarrantyNote LANG={LANG} T={T} /> : null}

          {/* 商家回复 */}
          {data.seller_reply && !isRejected ? (
            <div className={styles.info_card}>
              <div className={styles.section_title}>
                {T(
                  LANG,
                  "user_account.after_sale.seller_reply",
                  "Reply from our team"
                )}
              </div>
              <div className={styles.description}>{data.seller_reply}</div>
            </div>
          ) : null}
        </>
      ) : null}

      <ShowTipModal ref={tipRef} />
    </div>
  );
}
