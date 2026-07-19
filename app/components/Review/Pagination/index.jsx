"use client";

import React from "react";
import styles from "./index.module.scss";

// 生成页码序列（含省略号）：始终显示首末页 + 当前页前后各 1 页。
function buildPages(current, totalPages) {
  const around = new Set([1, totalPages, current, current - 1, current + 1]);
  const pages = [];
  let prev = 0;
  for (let p = 1; p <= totalPages; p++) {
    if (!around.has(p)) continue;
    if (p - prev > 1) pages.push("...");
    pages.push(p);
    prev = p;
  }
  return pages;
}

/**
 * Pagination —— 行业标准页码分页器（上一页 / 页码 + 省略号 / 下一页）。
 * 仅当总页数 > 1 时渲染。
 *
 * @param {number} current   当前页（从 1 起）
 * @param {number} total     总条数
 * @param {number} pageSize  每页条数，默认 10
 * @param {(page:number)=>void} onChange 翻页回调
 */
export default function Pagination({
  current = 1,
  total = 0,
  pageSize = 10,
  onChange,
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (totalPages <= 1) return null;

  const go = (p) => {
    if (p < 1 || p > totalPages || p === current) return;
    onChange && onChange(p);
  };

  const pages = buildPages(current, totalPages);

  return (
    <div className={styles.pagination} data-role="pagination">
      <button
        type="button"
        className={styles.arrow}
        disabled={current <= 1}
        onClick={() => go(current - 1)}
        aria-label="previous page"
      >
        ‹
      </button>
      {pages.map((p, i) =>
        p === "..." ? (
          <span key={`ellipsis-${i}`} className={styles.ellipsis}>
            …
          </span>
        ) : (
          <button
            type="button"
            key={p}
            className={`${styles.page} ${
              p === current ? styles.active : ""
            }`.trim()}
            onClick={() => go(p)}
            aria-current={p === current ? "page" : undefined}
          >
            {p}
          </button>
        )
      )}
      <button
        type="button"
        className={styles.arrow}
        disabled={current >= totalPages}
        onClick={() => go(current + 1)}
        aria-label="next page"
      >
        ›
      </button>
    </div>
  );
}
