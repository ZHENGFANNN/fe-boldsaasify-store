"use client";

import React from "react";
import { tryReloadOnChunkError } from "@/utils/chunkReload";

/**
 * 根级错误边界（兜住根布局及其子树抛出的错误，包括 chunk 加载失败）。
 * global-error 会替换整个页面，必须自带 <html>/<body>。
 * chunk 错误 → 自动刷新一次恢复；其他错误 → 展示极简回退页 + 手动刷新/返回。
 */
export default function GlobalError({ error, reset }) {
  React.useEffect(() => {
    // 已触发自动刷新则无需再渲染交互（页面即将重载）。
    tryReloadOnChunkError(error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: 0,
          fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
          color: "#1b1b1b",
          background: "#fff",
        }}
      >
        <div style={{ textAlign: "center", padding: "24px", maxWidth: "420px" }}>
          <h2 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "8px" }}>
            This page couldn&apos;t load
          </h2>
          <p style={{ fontSize: "14px", color: "#666", marginBottom: "20px" }}>
            Please reload to try again, or go back.
          </p>
          <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
            <button
              type="button"
              onClick={() => window.location.reload()}
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
      </body>
    </html>
  );
}
