"use client";

import React from "react";
import { resolveIntlLocale } from "@/utils";
import PreviewMediaList from "@/components/PreviewMediaList";
import StarRating from "../StarRating";
import styles from "./index.module.scss";

// created_time 归一为 Date：兼容 秒级/毫秒级 epoch 与 ISO 字符串。
function normalizeTime(t) {
  if (t == null || t === "") return null;
  if (typeof t === "number" || /^\d+$/.test(String(t))) {
    let n = Number(t);
    if (n < 1e12) n = n * 1000; // 秒级 → 毫秒
    const d = new Date(n);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  const d = new Date(t);
  return Number.isNaN(d.getTime()) ? null : d;
}

/**
 * ReviewCard —— 单条评论卡：脱敏用户名 + 星级 + 日期 + 内容 + 图/视频缩略图 + 运营回复。
 * 纯展示组件，数据由调用方（商品页评论模块 / 账户端评价列表）传入，可复用。
 *
 * @param {{id, rating, content, media, seller_reply, email, created_time, verified}} review
 * @param {Record<string,string>} LANG  i18n 文案对象（LANG["key"]）
 * @param {string} locale
 * @param {string} area
 */
export default function ReviewCard({
  review,
  LANG = {},
  locale = "en",
  area = "us",
}) {
  const {
    rating = 0,
    content = "",
    media = [],
    seller_reply: sellerReply = "",
    email = "",
    created_time: createdTime,
    verified = false,
  } = review || {};

  const dateText = React.useMemo(() => {
    const d = normalizeTime(createdTime);
    if (!d) return "";
    try {
      return d.toLocaleDateString(resolveIntlLocale(locale, area), {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return d.toISOString().slice(0, 10);
    }
  }, [createdTime, locale, area]);

  const userName = email || LANG["store.product.anonymous"] || "Anonymous";
  const mediaList = Array.isArray(media)
    ? media.filter((m) => m && m.url)
    : [];

  return (
    <div className={styles.card} data-role="review-card">
      <div className={styles.user}>
        <div className={styles.user_name}>{userName}</div>
        <StarRating value={rating} size={15} />
        {verified ? (
          <div className={styles.verified} data-role="verified-buyer">
            <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
              <path
                d="M12 2l2.4 1.8 3 .2.9 2.9L20.5 9l-.8 2.9.8 2.9-2.2 1.9-.9 2.9-3 .2L12 22l-2.4-1.8-3-.2-.9-2.9L3.5 15l.8-2.9-.8-2.9 2.2-1.9.9-2.9 3-.2L12 2z"
                fill="currentColor"
              />
              <path
                d="M8.5 12.2l2.3 2.3 4.5-4.6"
                fill="none"
                stroke="#fff"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span>{LANG["store.product.verified_buyer"] || "Verified Buyer"}</span>
          </div>
        ) : null}
        {dateText ? <div className={styles.date}>{dateText}</div> : null}
      </div>
      <div className={styles.body}>
        {content ? <div className={styles.content}>{content}</div> : null}
        {mediaList.length > 0 ? (
          <PreviewMediaList
            list={mediaList}
            thumbSize={88}
            className={styles.media}
          />
        ) : null}
        {sellerReply ? (
          <div className={styles.reply}>
            <span className={styles.reply_label}>
              {LANG["store.product.seller_reply"] || "Seller reply"}
            </span>
            <span className={styles.reply_text}>{sellerReply}</span>
          </div>
        ) : null}
      </div>
    </div>
  );
}
