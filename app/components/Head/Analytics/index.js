/**
 * 商城埋点配置读取（GA4 + Facebook Pixel）。
 *
 * 数据源：ERP 后台「全局管理 → 埋点管理」写入 config_global_settings.setting.analytics，
 * 由 script/fetch-config.js 在构建期物化到 fetch-data/globalConfig/index.json。
 * 保存后需重新构建/部署商城才会生效（build-time require）。
 *
 * 合规：脚本本身不再无条件注入 <head>，改由 AnalyticsGate（客户端）按 Cookie 同意
 * （useCookieConsent）加载——欧洲(GDPR)默认不加载、美国默认加载。见 ./Gate。
 *
 * XSS 兜底：ID 只以字符串插入，前后端各正则一次；非法值一律不渲染。
 */

// 与 ERP 侧 GA4/Pixel 组件保持一致的正则
const GA4_ID_REGEX = /^G-[A-Z0-9]{4,20}$/;
const PIXEL_ID_REGEX = /^\d{6,20}$/;

const loadAnalyticsConfig = () => {
  try {
    // 构建期时序容错：首次 CI 构建 globalConfig/index.json 由 fetch-config 写入，
    // 若在其生成前被 import 会 MODULE_NOT_FOUND，与 marketSettings.ts 保持同一兜底思路。
    const cfg = require("../../../../fetch-data/globalConfig/index.json");
    return cfg && typeof cfg === "object" ? cfg["setting.analytics"] || {} : {};
  } catch {
    return {};
  }
};

/**
 * 读取并校验埋点 ID（服务端/构建期调用）。非法或未启用返回 null。
 * 只把校验过的 ID 传给客户端 gate，避免整份 globalConfig 进客户端包。
 * @returns {{ ga4Id: string|null, pixelId: string|null }}
 */
export function getAnalyticsIds() {
  const cfg = loadAnalyticsConfig();
  const ga4 = cfg.ga4 || {};
  const pixel = cfg.pixel || {};
  const ga4Id =
    ga4.enabled &&
    typeof ga4.measurementId === "string" &&
    GA4_ID_REGEX.test(ga4.measurementId)
      ? ga4.measurementId
      : null;
  const pixelId =
    pixel.enabled &&
    typeof pixel.pixelId === "string" &&
    PIXEL_ID_REGEX.test(pixel.pixelId)
      ? pixel.pixelId
      : null;
  return { ga4Id, pixelId };
}

// noscript 兜底（Pixel）。注：noscript 无法读同意状态，仅在禁用 JS 时生效，属极端边缘。
export function AnalyticsNoScript() {
  const { pixelId } = getAnalyticsIds();
  if (!pixelId) return null;
  return (
    <noscript>
      <img
        height="1"
        width="1"
        style={{ display: "none" }}
        src={`https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1`}
        alt=""
      />
    </noscript>
  );
}
