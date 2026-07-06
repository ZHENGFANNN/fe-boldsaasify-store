"use client";

import React from "react";
import { tryReloadOnChunkError } from "@/utils/chunkReload";

/**
 * 兜底监听 React 错误边界抓不到的 chunk 加载失败：
 *   - unhandledrejection：动态 import() 的 promise 被拒（事件处理器里懒加载失败常见于此）。
 *   - error（捕获阶段）：<script>/<link> 资源加载失败，只在 _next/static 的 js/css 上触发刷新，
 *     避免图片等其他资源失败误刷。
 * 与 global-error / error 边界共用 tryReloadOnChunkError（sessionStorage 防死循环）。
 */
export default function ChunkErrorReloader() {
  React.useEffect(() => {
    const onRejection = (e) => {
      if (tryReloadOnChunkError(e?.reason)) {
        e.preventDefault?.();
      }
    };
    const onError = (e) => {
      // 普通脚本错误带 error 对象。
      if (e?.error && tryReloadOnChunkError(e.error)) return;
      // 资源加载失败（script/link）无 error 对象，靠 target 与 URL 判断。
      const target = e?.target;
      if (target && (target.tagName === "SCRIPT" || target.tagName === "LINK")) {
        const url = target.src || target.href || "";
        if (/_next\/static\/.+\.(js|css)(\?|$)/.test(url)) {
          tryReloadOnChunkError({
            name: "ChunkLoadError",
            message: `Loading chunk failed: ${url}`,
          });
        }
      }
    };
    window.addEventListener("unhandledrejection", onRejection);
    // 资源加载错误不冒泡，必须用捕获阶段。
    window.addEventListener("error", onError, true);
    return () => {
      window.removeEventListener("unhandledrejection", onRejection);
      window.removeEventListener("error", onError, true);
    };
  }, []);

  return null;
}
