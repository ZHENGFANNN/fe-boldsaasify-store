/** @format */

/**
 * 把配置正文里的 ${var} 占位符替换为实际值。
 *
 * 背景：protocol 系列文案（销售/隐私/用户协议/FAQ）在配置库里存的是
 * 原始模板字符串，含 ${company_name}、${email} 等占位符（旧 Node 后端
 * 用 handlebars 渲染，迁移到 Go + 前端取词后没人再替换）。这里在前端
 * 渲染前做一次替换，未知占位符原样保留。
 *
 * 同时充当 undefined 守卫：非字符串入参返回空串，避免把 undefined 喂给
 * dangerouslySetInnerHTML 触发渲染报错。
 *
 * @param {string} tpl 模板字符串
 * @param {Record<string,string>} vars 变量表
 * @returns {string}
 */
export default function fillTemplate(tpl, vars = {}) {
  if (typeof tpl !== "string") return "";
  return tpl.replace(/\$\{(\w+)\}/g, (match, key) =>
    vars[key] != null ? vars[key] : match
  );
}
