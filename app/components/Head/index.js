import { BlockSmartsupp } from "./GTM/blockSmartsupp";
import { GTM } from "./GTM";

export default function Head({ logoLink }) {
  return (
    <head>
      {/* website Logo */}
      <link rel="icon" href={logoLink} />
      {/* 拦截 GTM 仍可能注入的 Smartsupp；长期应在 GTM 控制台删除该 Tag */}
      <BlockSmartsupp />
      {/* Google GTM — 容器 ID 来自 NEXT_PUBLIC_GTM，加载 googletagmanager.com 线上配置 */}
      <GTM />
      {/* image loading */}
      <style>{`
          img {
            &[data-src], &[data-loading] {
              background-image: url('${logoLink}');
            }
          }
        `}</style>
    </head>
  );
}
