/**
 * @desc 复制文本到剪贴板
 *       优先走 navigator.clipboard，兼容非 https / 老浏览器时回退到 textarea + execCommand。
 * @param {string} text 待复制的文本
 * @returns {Promise<boolean>} 成功 true / 失败 false（永远 resolve，不 reject，调用方直接 await 判定）
 */
export async function copyToClipboard(text) {
  const value = text == null ? "" : String(text);
  if (!value) return false;

  if (
    typeof navigator !== "undefined" &&
    navigator.clipboard &&
    typeof navigator.clipboard.writeText === "function"
  ) {
    try {
      await navigator.clipboard.writeText(value);
      return true;
    } catch {
      // 继续走 fallback
    }
  }

  if (typeof document === "undefined") return false;

  try {
    const ta = document.createElement("textarea");
    ta.value = value;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.left = "-9999px";
    ta.style.top = "0";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    return !!ok;
  } catch {
    return false;
  }
}
