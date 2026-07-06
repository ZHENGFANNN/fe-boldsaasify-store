import Script from "next/script";

/**
 * 商城埋点注入：GA4 + Facebook Pixel。
 *
 * 数据源：ERP 后台「全局管理 → 埋点管理」写入 config_global_settings.setting.analytics，
 * 由 script/fetch-config.js 在构建期物化到 fetch-data/globalConfig/index.json。
 * 保存后需重新构建/部署商城才会生效（不做 ISR 主动失效，head 脚本走 build-time require）。
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

export default function Analytics() {
  const cfg = loadAnalyticsConfig();
  const ga4 = cfg.ga4 || {};
  const pixel = cfg.pixel || {};

  const ga4Enabled =
    ga4.enabled && typeof ga4.measurementId === "string" && GA4_ID_REGEX.test(ga4.measurementId);
  const pixelEnabled =
    pixel.enabled && typeof pixel.pixelId === "string" && PIXEL_ID_REGEX.test(pixel.pixelId);

  const ga4Id = ga4Enabled ? ga4.measurementId : null;
  const pixelId = pixelEnabled ? pixel.pixelId : null;

  return (
    <>
      {ga4Id ? (
        <>
          <Script
            id="ga4-loader"
            strategy="afterInteractive"
            src={`https://www.googletagmanager.com/gtag/js?id=${ga4Id}`}
          />
          <Script
            id="ga4-init"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${ga4Id}');`,
            }}
          />
        </>
      ) : null}

      {pixelId ? (
        <Script
          id="fb-pixel-init"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              !function(f,b,e,v,n,t,s)
              {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)}(window,document,'script',
              'https://connect.facebook.net/en_US/fbevents.js');
              fbq('init', '${pixelId}');
              fbq('track', 'PageView');`,
          }}
        />
      ) : null}
    </>
  );
}

// noscript 兜底（GA4 无 noscript；Pixel 依赖 fetch-config 拉下来的 ID 才渲染）
export function AnalyticsNoScript() {
  const cfg = loadAnalyticsConfig();
  const pixel = cfg.pixel || {};
  const enabled =
    pixel.enabled && typeof pixel.pixelId === "string" && PIXEL_ID_REGEX.test(pixel.pixelId);
  if (!enabled) return null;
  return (
    <noscript>
      <img
        height="1"
        width="1"
        style={{ display: "none" }}
        src={`https://www.facebook.com/tr?id=${pixel.pixelId}&ev=PageView&noscript=1`}
        alt=""
      />
    </noscript>
  );
}
