/** @format */

const path = require("path");

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
  // 图片白名单
  images: {
    domains: ["image.sslfly.com", "public.sslfly.com"],
  },

  async redirects() {
    return [
      {
        source: "/product",
        destination: "/",
        permanent: true,
      },
    ];
  },

  webpack: (config) => {
    config.resolve.alias["@"] = path.join(__dirname, "app");
    config.resolve.alias["@@"] = __dirname;
    return config;
  },
};

module.exports = nextConfig;
