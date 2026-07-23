"use client";

import Script from "next/script";
import { useCookieConsent } from "@/hooks/useCookieConsent";

/**
 * AnalyticsGate —— 按 Cookie 同意加载 GA4 / Facebook Pixel。
 *
 * 合规：欧洲(GDPR)默认不加载（opt-in），美国等默认加载（opt-out）——由 useCookieConsent
 * 按当前站点 area 推导。consent.ready 之前一律不渲染，避免读到真实地区/偏好前误加载。
 * 分析类脚本(GA4)受 analytical 开关，营销类(Pixel)受 marketing 开关。
 *
 * 注：opt-out 地区若用户加载后再关闭，已注入的脚本不会被卸载（PageView 已发）；
 * 需要彻底停用可结合 Google Consent Mode，本期先做加载 gate。
 */
export default function AnalyticsGate({ ga4Id, pixelId }) {
  const consent = useCookieConsent();
  if (!consent.ready) return null;

  return (
    <>
      {ga4Id && consent.analytical ? (
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

      {pixelId && consent.marketing ? (
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
