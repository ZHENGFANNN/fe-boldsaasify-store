import { buildThemeVars } from "@/config/themeSettings";

/**
 * 薄主题层注入：把 common.base.theme 派生的合法 CSS 变量输出成 <style>:root{...}</style>。
 *
 * 数据源：common.base.theme（克隆 bundle 写入 / ERP 页面配置），由 layout.js 的
 * getRemoteConfig 运行期拉取后以 theme prop 传入，SSR 直出、无客户端闪烁、不碰 OpenNext 构建。
 *
 * 安全：变量名与值均已在 themeSettings 逐 key 白名单 + 逐值正则校验，此处仅拼接合法片段。
 * 无合法 token 时不渲染 —— 组件端 var(--x, 原默认值) 自然回退，零破坏。
 */
export default function ThemeStyle({ theme }) {
  const css = buildThemeVars(theme);
  if (!css) return null;
  return <style id="site-theme" dangerouslySetInnerHTML={{ __html: css }} />;
}
