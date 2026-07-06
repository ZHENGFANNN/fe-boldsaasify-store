"use client";

/**
 * ChunkLoadError 自动恢复。
 *
 * 背景：每次部署 next.config 的 generateBuildId 变化 → 所有带 build ID 的 JS/CSS chunk
 * 路径改变，旧部署的 chunk 在生产域名（Cloudflare Pages 只服务最新部署）上 404。
 * 停留在旧版本页面的用户一旦客户端路由跳转/触发懒加载，请求旧 chunk → "Loading chunk failed"。
 * 硬刷新即可拿到新 build ID 的 HTML 恢复。此模块统一识别该类错误并「自动刷新一次」。
 *
 * 防死循环：用 sessionStorage 记录上次自动刷新时间，10s 内不再自动刷新
 * （刷新后仍报同一错误 → 大概率真·资源损坏，停手交给错误 UI，避免无限刷新）。
 */

const RELOAD_FLAG = "__chunk_reload_at";
const RELOAD_WINDOW_MS = 10000;

// 识别 chunk 加载失败：webpack/turbopack 的 ChunkLoadError、ESM 动态导入失败、CSS chunk 失败。
export function isChunkLoadError(error) {
  if (!error) return false;
  const name = (error.name || "").toString();
  const msg = (error.message || String(error) || "").toString();
  return (
    name === "ChunkLoadError" ||
    /Loading chunk [\w./-]+ failed/i.test(msg) ||
    /Loading CSS chunk/i.test(msg) ||
    /Failed to fetch dynamically imported module/i.test(msg) ||
    /error loading dynamically imported module/i.test(msg) ||
    /importing a module script failed/i.test(msg)
  );
}

/**
 * 若 error 是 chunk 加载失败则自动刷新一次。
 * @returns {boolean} true=已触发刷新（调用方可直接 return，不必渲染错误 UI）。
 */
export function tryReloadOnChunkError(error) {
  if (typeof window === "undefined") return false;
  if (!isChunkLoadError(error)) return false;
  try {
    const last = Number(window.sessionStorage.getItem(RELOAD_FLAG) || 0);
    const now = Date.now();
    if (now - last < RELOAD_WINDOW_MS) {
      // 刚自动刷新过仍报同样错 → 停止自动刷新，交给错误 UI。
      return false;
    }
    window.sessionStorage.setItem(RELOAD_FLAG, String(now));
  } catch {
    // sessionStorage 不可用（隐私模式等）→ 直接刷新一次兜底。
  }
  window.location.reload();
  return true;
}
