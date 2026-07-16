/** @format */

// 薄主题层：把克隆模板抓到的视觉 token（配色/字体/圆角）派生成一段 :root CSS 变量，
// 由 layout.js 在 SSR 时注入，供第一梯队组件 var(--x, 原默认值) 消费。
//
// 存储：theme 搭在 common.base 页面配置里（`CONFIG["common.base"].theme`），
// 走运行期 getRemoteConfig 通道下发（与 logo 同源），天然 per-site、零后端表结构改动、
// import-site 沿 page.brand.json(common.base) 既有写入链路即可带上。
//
// 安全：token 值最终写进 <style>，属不可信输入（来自 ERP 配置 / 克隆模板）。
// 逐 key 白名单 + 逐值严格正则校验，非法一律丢弃，杜绝 CSS 注入 / 越出 style 标签。

/** common.base.theme 原始记录（宽松入参，字段可缺） */
export interface SiteTheme {
  fontBase?: string;
  colorCta?: string;
  colorCtaHover?: string;
  colorCtaActive?: string;
  colorCtaFg?: string;
  radiusPill?: string;
  [key: string]: unknown;
}

/** token key → CSS 变量名 + 值校验器（白名单，未列出的 key 一律忽略） */
const COLOR_RE = /^#[0-9a-fA-F]{3,8}$|^rgba?\(\s*[\d.,\s%]+\)$|^[a-z]{3,20}$/;
const LENGTH_RE = /^\d{1,4}(px|rem|em|%)$/;
// 字体栈：仅字母数字、空格、逗号、连字符、引号；限长防塞入结构字符
const FONT_RE = /^[a-zA-Z0-9\s,'"-]{1,200}$/;

const TOKEN_MAP: Record<string, { cssVar: string; valid: (v: string) => boolean }> = {
  fontBase: { cssVar: "--font-base", valid: (v) => FONT_RE.test(v) },
  colorCta: { cssVar: "--color-cta", valid: (v) => COLOR_RE.test(v) },
  colorCtaHover: { cssVar: "--color-cta-hover", valid: (v) => COLOR_RE.test(v) },
  colorCtaActive: { cssVar: "--color-cta-active", valid: (v) => COLOR_RE.test(v) },
  colorCtaFg: { cssVar: "--color-cta-fg", valid: (v) => COLOR_RE.test(v) },
  radiusPill: { cssVar: "--radius-pill", valid: (v) => LENGTH_RE.test(v) },
};

/** 从 theme 对象取出白名单内、通过校验的 token（CSS 变量名 → 值） */
export const getThemeVars = (theme?: SiteTheme | null): Record<string, string> => {
  const vars: Record<string, string> = {};
  if (!theme || typeof theme !== "object") return vars;
  for (const [key, spec] of Object.entries(TOKEN_MAP)) {
    const raw = theme[key];
    if (typeof raw === "string" && raw.trim() && spec.valid(raw.trim())) {
      vars[spec.cssVar] = raw.trim();
    }
  }
  return vars;
};

/**
 * 产出 :root CSS 字符串，供 <style> 注入。
 * 无合法 token 时返回空串 → 组件端 var(--x, 原默认值) 自然回退，零破坏。
 */
export const buildThemeVars = (theme?: SiteTheme | null): string => {
  const entries = Object.entries(getThemeVars(theme));
  if (entries.length === 0) return "";
  return `:root{${entries.map(([k, v]) => `${k}:${v};`).join("")}}`;
};

export default { getThemeVars, buildThemeVars };
