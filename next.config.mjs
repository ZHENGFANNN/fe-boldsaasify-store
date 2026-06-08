import path from "path";
import { fileURLToPath } from "url";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

initOpenNextCloudflareForDev();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
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
  }
};

export default nextConfig;
