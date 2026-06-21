import { GTM } from "./GTM";

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
      {/* Google GTM — 容器 ID 来自 NEXT_PUBLIC_GTM，加载 googletagmanager.com 线上配置 */}
      <GTM />
    </head>
  );
}
