"use client";

import React from "react";
import { tryReloadOnChunkError } from "@/utils/chunkReload";

/**
 * [locale] 段错误边界：捕获该段内页面渲染/导航抛出的错误（含 chunk 加载失败）。
 * chunk 错误 → 自动刷新一次；其他错误 → reset() 重试当前段，或手动刷新/返回。
 * 渲染在 [locale]/layout 的 <body> 内，无需自带 html/body。
 */
export default function LocaleError({ error, reset }) {
  React.useEffect(() => {
    tryReloadOnChunkError(error);
  }, [error]);

  return (
    <div
      style={{
        minHeight: "60vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        textAlign: "center",
      }}
    >
      <div style={{ maxWidth: "420px" }}>
        <h2 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "8px" }}>
          This page couldn&apos;t load
        </h2>
        <p style={{ fontSize: "14px", color: "#666", marginBottom: "20px" }}>
          Please reload to try again, or go back.
        </p>
        <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
          <button
            type="button"
            onClick={() => (typeof reset === "function" ? reset() : window.location.reload())}
            style={{
              padding: "10px 20px",
              borderRadius: "6px",
              border: "none",
              background: "#1b1b1b",
              color: "#fff",
              fontSize: "14px",
              cursor: "pointer",
            }}
          >
            Reload
          </button>
          <button
            type="button"
            onClick={() => window.history.back()}
            style={{
              padding: "10px 20px",
              borderRadius: "6px",
              border: "1px solid #d0d0d0",
              background: "#fff",
              color: "#1b1b1b",
              fontSize: "14px",
              cursor: "pointer",
            }}
          >
            Go back
          </button>
        </div>
      </div>
    </div>
  );
}
