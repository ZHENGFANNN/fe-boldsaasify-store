/** @format */

const fs = require("fs");
const { SitemapStream, streamToPromise } = require("sitemap");
const chalk = require("chalk");
const { join } = require("path");
const { Readable } = require("stream");

const productPath = require("../public/config/product/sitemap/en.json");
const blogPath = require("../public/config/blog/sitemap/en.json");

const { languageList } = require("../app/config/LANGUAGE");

const domain = process.env.NEXT_PUBLIC_DOMAIN;
// 排除路径
function getExcludePath() {
  return [
    "/user/forget",
    "/user/account",
    "/cart",
    "/order",
    "/404",
    "/[...notFound]",
    // 列表处理
    "/nav/[type]",
    "/product/[sortKey]/[productKey]",
    "/blog/[sortKey]",
    "/blog/[sortKey]/[blogKey]",
  ];
}

// 获取导航栏路径
function getNavPath() {
  const pathList = [];
  const navList = [
    "/nav/product_categories",
    "/nav/product_info",
    "/nav/support",
    "/nav/about_us",
  ];
  languageList.forEach((language) => {
    navList.forEach((nav) => {
      pathList.push(`/${language.value}${nav}`);
    });
  });
  return pathList;
}

// 获取博客列表路径
function getBlogPath() {
  const pathList = [];
  languageList.forEach((languageMap) => {
    blogPath.forEach((path) => {
      const locale = languageMap.value === "en" ? "" : `/${languageMap.value}`;
      pathList.push(`${locale}${path}`);
    });
  });
  return pathList;
}

// 获取产品列表路径
function getProductPath() {
  const pathList = [];
  languageList.forEach((languageMap) => {
    productPath.forEach((path) => {
      const locale = languageMap.value === "en" ? "" : `/${languageMap.value}`;
      pathList.push(`${locale}${path}`);
    });
  });
  return pathList;
}

// 获取所有页面
const getAllPages = (dir = "") => {
  const pagesDir = join(process.cwd(), "app", dir);
  const files = fs.readdirSync(pagesDir);
  let pages = [];
  files.forEach((file) => {
    if (fs.statSync(join(pagesDir, file)).isDirectory()) {
      pages = pages.concat(getAllPages(join(dir, file)));
    } else {
      if (file.endsWith("page.jsx")) {
        const page = join(dir, file)
          .replace(/page.jsx$/, "")
          .replace(/\/$/, "");
        pages.push(page);
      }
    }
  });

  return pages;
};

async function getSitMap(times = 1) {
  const startTime = new Date().getTime();
  let error = false;
  console.log(`${chalk.yellow("【开始获取SITEMAP】")}`);
  try {
    // 获取所有可用的 locale
    const locales = languageList.map((item) => item.value);
    // 创建一个 SitemapStream 对象
    const stream = new SitemapStream({ hostname: domain });

    const pages = getAllPages();
    const allPages = [];

    // 路径来处理
    pages.forEach((page) => {
      // 处理普通路径
      if (page.includes("[locale]")) {
        for (const locale of locales) {
          const url = page
            .replace(`[locale]`, locale === "en" ? "" : locale)
            .replace(/\/$/, "");
          // 排查特殊页面
          const isExcludeUrl = getExcludePath().some((item) => {
            return url.includes(item);
          });

          if (!isExcludeUrl) {
            allPages.push({ url, lastmod: new Date() });
          }
        }
      }

      // 处理导航类目
      if (page.includes("/nav/[type]")) {
        const navPaths = getNavPath();
        for (const navPath of navPaths) {
          allPages.push({ url: navPath, lastmod: new Date() });
        }
      }

      // 处理博客路径
      if (page.includes("[locale]/blog/[sortKey]/[blogKey]")) {
        const blogPaths = getBlogPath();
        for (const blogPath of blogPaths) {
          allPages.push({ url: blogPath, lastmod: new Date() });
        }
      }

      // 处理产品路径
      if (page.includes("[locale]/product/[sortKey]/[productKey]")) {
        const productPaths = getProductPath();
        for (const productPath of productPaths) {
          allPages.push({ url: productPath, lastmod: new Date() });
        }
      }
    });
    const sitemap = (
      await streamToPromise(Readable.from(allPages).pipe(stream))
    ).toString();
    const filePath = join(process.cwd(), "public", "sitemap.xml");
    fs.writeFileSync(filePath, sitemap);
    console.log(
      `${chalk.green("【SITEMAP获取时长】")} ${
        new Date().getTime() - startTime
      }ms`
    );
  } catch (err) {
    error = true;
    console.log(`${chalk.red("【SITEMAP获取失败】")}`, err);
  } finally {
    times = times + 1;
    if (error && times < 4) {
      getSitMap(times);
      console.log(`${chalk.red(`【!!!SITEMAP第${times}次获取!!!】`)}`);
    }
    if (error && times > 3) {
      console.log(`${chalk.red("【!!!SITEMAP连续三次获取失败!!!】")}`);
      throw "【!!!SITEMAP连续三次获取失败!!!】";
    }
  }
}

module.exports = getSitMap;
