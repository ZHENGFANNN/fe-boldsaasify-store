import path from "path";
import { fileURLToPath } from "url";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

initOpenNextCloudflareForDev();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  // cacheComponents（Cache Components / PPR）已关闭：
  // 该模式会把页面渲染为「静态 HTML 外壳 + 动态 server-streamed 块」(◐ Partial Prerender)，
  // 即流式渲染。改用传统 ISR：fetch 打 next:{tags,revalidate}，由 /api/revalidate 按需重建。
  // 构建ID
  generateBuildId: () => {
    return "official:" + new Date().getTime();
  },
  // react严格模式
  reactStrictMode: false,
  // 压缩模式
  compress: true,
  // 开启ETag
  generateEtags: true,
  // 显式锁定文件追踪根到本项目目录，避免 Next 沿目录树向上误判 root。
  outputFileTracingRoot: __dirname,
  // Next 16 默认 Turbopack。
  // @/@@ 路径别名由 tsconfig.json 的 paths 提供（Next/Turbopack 原生读取），
  // .ts/.tsx/.js 混存由 Turbopack 默认 resolveExtensions 解析，
  // 故原 webpack 块（resolve.alias + extensionAlias）已无需保留。
  // root 显式锁定到本目录，与 outputFileTracingRoot 一致。
  turbopack: {
    root: __dirname
  },
  // 旧路由 301 永久跳转到 /support 下（保留已被收录 URL 的权重）。
  // 兼容带/不带 locale 前缀两种形式（默认语言 en 无前缀）。
  async redirects() {
    return [
      {
        source: "/after-sale",
        destination: "/support/after-sale",
        permanent: true
      },
      {
        source: "/:locale/after-sale",
        destination: "/:locale/support/after-sale",
        permanent: true
      },
      {
        source: "/company/contact",
        destination: "/support/contact",
        permanent: true
      },
      {
        source: "/:locale/company/contact",
        destination: "/:locale/support/contact",
        permanent: true
      }
    ];
  }
};

export default nextConfig;
