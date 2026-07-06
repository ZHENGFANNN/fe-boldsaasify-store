import Analytics from "./Analytics";

export default function Head({ logoLink }) {
  const apiOrigin = process.env.NEXT_PUBLIC_HOST?.replace(/\/$/, "");

  return (
    <head>
      {/* website Logo */}
      <link rel="icon" href={logoLink} />
      {/* 提前与 API 域名建连，缩短 LiveChat 首次/idle 后请求的 Stalled */}
      {apiOrigin ? (
        <>
          <link rel="dns-prefetch" href={apiOrigin} />
          <link rel="preconnect" href={apiOrigin} crossOrigin="anonymous" />
        </>
      ) : null}
      {/* GA4 / Facebook Pixel — 由 ERP 全局管理 → 埋点管理配置，构建期物化到 fetch-data */}
      <Analytics />
    </head>
  );
}
