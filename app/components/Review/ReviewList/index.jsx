"use client";

import React from "react";
import Loading from "@/components/Loading";
import Empyt from "@/components/Empyt";
import ReviewCard from "../ReviewCard";
import styles from "./index.module.scss";

/**
 * ReviewList —— 评论列表容器：处理 loading / error / empty 三态，正常态渲染 ReviewCard 列表。
 * 纯展示组件，分页由外层控制（列表只渲染当前页数据）。
 */
export default function ReviewList({
  list = [],
  LANG = {},
  locale = "en",
  area = "us",
  loading = false,
  error = false,
  onRetry,
}) {
  if (loading) {
    return (
      <div className={styles.state} data-role="review-list-loading">
        <Loading height="120px" />
      </div>
    );
  }
  if (error) {
    return (
      <div className={styles.state} data-role="review-list-error">
        <p className={styles.error_text}>
          {LANG["common.other.load_failed"] || "Failed to load reviews."}
        </p>
        {onRetry ? (
          <button type="button" className={styles.retry} onClick={onRetry}>
            {LANG["common.other.retry"] || "Retry"}
          </button>
        ) : null}
      </div>
    );
  }
  if (!Array.isArray(list) || list.length === 0) {
    return (
      <div className={styles.state} data-role="review-list-empty">
        <Empyt />
      </div>
    );
  }
  return (
    <div className={styles.list} data-role="review-list">
      {list.map((item, i) => (
        <ReviewCard
          key={item?.id ?? i}
          review={item}
          LANG={LANG}
          locale={locale}
          area={area}
        />
      ))}
    </div>
  );
}
