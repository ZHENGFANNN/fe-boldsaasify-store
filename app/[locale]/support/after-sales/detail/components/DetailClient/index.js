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
import Button from "@/components/Button";
import ProgressSteps from "./parts/ProgressSteps";
import ServiceInfoCard from "./parts/ServiceInfoCard";
import CancelledBanner from "./parts/CancelledBanner";

// —— 常量 —— //
const T = (LANG, key, fallback) => LANG?.[key] || fallback;

const localeHref = (path, locale) =>
  locale && locale !== defaultLocale ? `/${locale}${path}` : path;

// 简化后的终态集合：已取消 / 已完成 / 已拒绝。
const TERMINAL_STATUS = new Set(["cancelled", "resolved", "rejected"]);

// 客户可自主取消的状态（对齐 order-service afterServiceCancelableStatus）。
const CANCELABLE_STATUS = new Set(["pending", "processing"]);

// 简化 3 步进度：提交成功 → 处理中 → 已完成。step = 当前进行到第几步。
const STEP_BY_STATUS = {
  pending: 1,
  processing: 2,
  resolved: 3,
};

// 由状态构建 3 步进度视图（终态不高亮 current）。
function buildSteps(data, LANG) {
  const step = STEP_BY_STATUS[data.status] || 1;
  return [
    { title: T(LANG, "user_account.after_sale.progress.submitted", "Submitted") },
    { title: T(LANG, "user_account.after_sale.progress.processing", "Processing") },
    { title: T(LANG, "user_account.after_sale.progress.resolved", "Completed") },
  ].map((it, i) => ({
    ...it,
    done: i + 1 < step,
    current: i + 1 === step && !TERMINAL_STATUS.has(data.status),
  }));
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

  const [cancelling, setCancelling] = React.useState(false);
  const handleCancel = React.useCallback(() => {
    if (!serviceNo || cancelling) return;
    setCancelling(true);
    Api.cancelAfterService({ service_no: serviceNo, reason: "" })
      .then((res) => {
        if (res.code !== 0) throw new Error("code!==0");
        toast(
          T(LANG, "user_account.after_sale.cancel_success", "Request cancelled."),
          true
        );
        refresh();
      })
      .catch(() =>
        toast(
          T(LANG, "user_account.after_sale.cancel_fail", "Failed to cancel, please try again."),
          false
        )
      )
      .finally(() => setCancelling(false));
  }, [serviceNo, cancelling, LANG, refresh, toast]);

  if (isLogin === null || loading) {
    return (
      <div className={styles.container}>
        <Loading height={400} />
      </div>
    );
  }

  // 未登录：直接返回守卫卡片，不套 .container 外层
  if (!isLogin) {
    return <AuthRedirectGuard LANG={LANG} redirectPath={redirectPath} />;
  }

  if (error || !data) {
    return (
      <div className={styles.container}>
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
      </div>
    );
  }

  const status = data.status;
  const isCancelled = status === "cancelled";
  const isRejected = status === "rejected";
  const isTerminal = TERMINAL_STATUS.has(status);
  const canCancel = CANCELABLE_STATUS.has(status);

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
    <div className={styles.container}>
      <div className={styles.detail}>
      {/* 顶部标题条 */}
      <h1 className="header">
        {T(
          LANG,
          "user_account.after_sale.progress_title",
          "After-Sales Progress"
        )}
      </h1>

      <div className={styles.parts}>
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
            <ProgressSteps steps={buildSteps(data, LANG)} />
          )}

          {/* 服务信息 */}
          <ServiceInfoCard
            data={data}
            LANG={LANG}
            T={T}
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
            <InfoRow
              label={T(
                LANG,
                "user_account.after_sale.service_no",
                "Request No."
              )}
              value={data.service_no}
            />
          </div>

          {/* 客户回寄快递（可选录入，非终态可填；仅展示已填信息，简化后不再是流程节点） */}
          {data.express_no ? (
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
                value={data.express_company}
              />
              <InfoRow
                label={T(LANG, "user_account.after_sale.tracking_no", "Tracking No.")}
                value={data.express_no}
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

          {/* 取消申请：仅 pending/processing 可取消 */}
          {canCancel ? (
            <div className={styles.cancel_action}>
              <Button
                variant="ghost"
                loading={cancelling}
                onClick={handleCancel}
              >
                {T(LANG, "user_account.after_sale.cancel_request", "Cancel Request")}
              </Button>
            </div>
          ) : null}
        </div>

      <ShowTipModal ref={tipRef} />
      </div>
    </div>
  );
}
