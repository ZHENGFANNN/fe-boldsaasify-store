import Script from "next/script";

/**
 * 通过 NEXT_PUBLIC_GTM 加载 Google 线上容器（如 GTM-K9H9G7SL），
 * 非 fe-dashbaord-boldradient/public/GTM-BoldSaasify.json。
 * 移除 Smartsupp 须在 tagmanager.google.com 删除对应 Tag/变量并发布；
 * 本地 JSON 仅为导出备份，改仓库文件不会自动同步到线上容器。
 */
export function GTM() {
  return (
    <>
      <Script
        id="google-tag-manager"
        dangerouslySetInnerHTML={{
          __html: `
            (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
            new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
            j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
            'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
            })(window,document,'script','dataLayer','${process.env.NEXT_PUBLIC_GTM}');`,
        }}
      />
    </>
  );
}

export function GTMNoScript() {
  return (
    <noscript>
      <iframe
        src={`https://www.googletagmanager.com/ns.html?id=${process.env.NEXT_PUBLIC_GTM}`}
        height="0"
        width="0"
        style={{
          display: "none",
          visibility: "hidden",
        }}
      ></iframe>
    </noscript>
  );
}
