/**
 * 可复用的博客发布器（Windows 友好，无需本地落地含冒号的目录）。
 *
 * 背景：前台运行时从 `${NEXT_PUBLIC_DOMAIN}/config/blog/<ns>/<locale>.json` 读取博客数据，
 * 这些文件是 CF Pages 部署的 public/config/blog/** 静态文件。原本由 `fetch-prod`(script/index.js)
 * 生成并提交。但生成目录名形如 `article:<sort>:<key>`（含冒号），NTFS 不允许，Windows 上跑不了。
 *
 * 本脚本复用 fetch-blog.js 的转换逻辑在内存里生成全部博客 JSON，然后通过 GitHub Git Data API
 * （blob/tree/commit/ref）一次性提交到 master —— GitHub 端路径支持冒号，绕开 Windows 限制。
 * push 后触发 Cloudflare Pages 部署。
 *
 * 每次改库后只需：node ./script/publish-blog-to-github.js
 *
 * 读取：
 *   - fe-boldradient/.env 的 NEXT_PUBLIC_HOST（后端 API）
 *   - 仓库根 .mcp.json 的 GitHub PAT（Authorization: Bearer ...）
 * 环境变量可覆盖：BLOG_API_HOST, GH_OWNER, GH_REPO, GH_BRANCH, GH_TOKEN
 */

const fs = require("fs");
const path = require("path");
const { languageList } = require("../app/config/languageSettings");

// ---- 配置读取 ----------------------------------------------------------------
function readEnvHost() {
  if (process.env.BLOG_API_HOST) return process.env.BLOG_API_HOST;
  try {
    const env = fs.readFileSync(path.join(__dirname, "..", ".env"), "utf8");
    const m = env.match(/^NEXT_PUBLIC_HOST\s*=\s*(.+)\s*$/m);
    if (m) return m[1].trim();
  } catch (_) {}
  throw new Error("找不到 NEXT_PUBLIC_HOST（请设 BLOG_API_HOST 或 .env）");
}

function readToken() {
  if (process.env.GH_TOKEN) return process.env.GH_TOKEN;
  // 从仓库根 .mcp.json 解析 Bearer token
  const candidates = [
    path.join(__dirname, "..", "..", ".mcp.json"),
    path.join(__dirname, "..", ".mcp.json")
  ];
  for (const p of candidates) {
    try {
      const t = fs.readFileSync(p, "utf8");
      const m = t.match(/Bearer\s+(github_pat_[A-Za-z0-9_]+|ghp_[A-Za-z0-9]+)/);
      if (m) return m[1];
    } catch (_) {}
  }
  throw new Error("找不到 GitHub PAT（请设 GH_TOKEN 或在 .mcp.json 提供）");
}

const API_HOST = readEnvHost();
const OWNER = process.env.GH_OWNER || "ZHENGFANNN";
const REPO = process.env.GH_REPO || "fe-boldradient";
const BRANCH = process.env.GH_BRANCH || "master";
const GH = "https://api.github.com";

// ---- 以下转换逻辑与 script/fetch-blog.js 保持一致（勿擅改格式）------------------
function handleAProductList(productList) {
  if (Array.isArray(productList) && productList.length > 0) {
    return productList.map(
      ({
        reviewsList,
        image_list,
        reviews_num,
        reviews_score,
        comboList,
        ...item
      }) => {
        const totalScore = reviewsList?.reduce(
          (pre, cur) => pre + cur.score,
          0
        );
        item.reviewScore = totalScore / reviewsList?.length || reviews_score;
        item.reviewsNum = reviewsList?.length || reviews_num;
        item.image = image_list[0].src;
        const { img_list, ...newComboItem } = comboList[0] || {};
        item.comboItem = newComboItem || {};
        return item;
      }
    );
  }
  return [];
}

function getHeadTitleId(title) {
  return title
    .toLowerCase()
    .replace(/<.*?>(.*?)<.*?>/gis, "$1")
    .replace(/[\'\"?:\.]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

function getHeadTitleList(html) {
  const headerRegex = /<h([23])[^>]*>(.*?)<\/h\1>/gis;
  const tagRegex = /<\/?[^>]+(>|$)/g;
  let matches = [];
  let match;
  while ((match = headerRegex.exec(html)) !== null) {
    const contentWithTags = match[0];
    const tagName = `h${match[1]}`;
    const id = getHeadTitleId(match[2]);
    const content = contentWithTags.replace(tagRegex, "").trim();
    matches.push({ tag: tagName, content: content, id });
  }
  return matches;
}

function addHeadTitleId(html) {
  const headerRegex = /<h([23])[^>]*>(.*?)<\/h\1>/gis;
  let match;
  while ((match = headerRegex.exec(html)) !== null) {
    const contentWithTags = match[0];
    const tagName = `h${match[1]}`;
    const content = match[2];
    const id = getHeadTitleId(content);
    html = html.replace(
      contentWithTags,
      `<${tagName} id="${id}">${content}</${tagName}>`
    );
  }
  return html;
}

function handleBlogData(list) {
  const obj = {};
  list.forEach(({ sortInfo, id, created_time, language, ...item }) => {
    const blogSortInfo = (sortInfo && sortInfo[0]) || {};
    item.blogSortInfo = blogSortInfo;
    item.content = addHeadTitleId(item.content || "");
    item.titleList = getHeadTitleList(item.content);
    // 修复：Go 版 getBlog 不返回关联字段，前台直接 .associateArticle.length，需兜底为 []
    if (!Array.isArray(item.associateArticle)) item.associateArticle = [];

    if (!obj["sitemap"]) obj["sitemap"] = [];
    obj["sitemap"].push(`/blog/${item.sort_key}/${item.key}`);
    if (!obj["sitemap"].includes(`/blog/${item.sort_key}`))
      obj["sitemap"].push(`/blog/${item.sort_key}`);

    if (item.recommend) {
      if (!obj["banner"]) obj["banner"] = [];
      obj["banner"].push({
        image: item.image,
        title: item.title,
        key: item.key,
        sort_key: item.sort_key
      });
    }

    obj[`article:${item.sort_key}:${item.key}`] = {
      ...item,
      associateProduct: handleAProductList(item.associateProduct)
    };

    const blogSortArticleItem = {
      image: item.image,
      title: item.title,
      key: item.key,
      sort_key: item.sort_key,
      updated_time: item.updated_time
    };
    if (!obj[`sort`]) obj[`sort`] = {};
    obj[`sort`][`${item.sort_key}`] = {
      weight: blogSortInfo.weight,
      key: blogSortInfo.key,
      name: blogSortInfo.name,
      blogList: obj[`sort`][`${item.sort_key}`]
        ? [...obj[`sort`][`${item.sort_key}`].blogList, blogSortArticleItem]
        : [blogSortArticleItem]
    };
  });

  obj["layout"] = {};
  obj["layout"]["footer"] = Object.keys(obj["sort"] || {})
    .filter((_, index) => index < 8)
    .map((item) =>
      obj["sort"][item]
        ? { name: obj["sort"][item].name, key: obj["sort"][item].key }
        : {}
    );
  obj["layout"]["nav"] = list
    .filter((_, index) => index < 8)
    .map(({ title, key, sort_key }) => ({ title, key, sort_key }));

  return obj;
}

// ---- GitHub Git Data API helpers --------------------------------------------
const TOKEN = readToken();
async function gh(method, url, body) {
  const res = await fetch(url.startsWith("http") ? url : `${GH}${url}`, {
    method,
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      Accept: "application/vnd.github+json",
      "User-Agent": "boldradiant-blog-publisher",
      "X-GitHub-Api-Version": "2022-11-28",
      ...(body ? { "Content-Type": "application/json" } : {})
    },
    body: body ? JSON.stringify(body) : undefined
  });
  const text = await res.text();
  if (!res.ok)
    throw new Error(`${method} ${url} -> ${res.status}: ${text.slice(0, 300)}`);
  return text ? JSON.parse(text) : {};
}

async function main() {
  console.log(`[1/5] 拉取 ${API_HOST}/config/getBlog ...`);
  const r = await fetch(`${API_HOST}/config/getBlog`, {
    headers: { "User-Agent": "boldradiant-blog-publisher" }
  });
  const body = await r.json();
  const list = body?.data?.list || [];
  if (!list.length)
    throw new Error("getBlog 返回空 list，中止（疑似后端异常），不发布");
  console.log(`      共 ${list.length} 篇文章`);

  // 按语言分组（API 目前主要返回 en），缺失语言回退 en
  const byLang = {};
  list.forEach((item) => {
    (byLang[item.language] = byLang[item.language] || []).push(item);
  });
  languageList.forEach((l) => {
    if (!byLang[l.value]) byLang[l.value] = byLang["en"] || [];
  });

  // 生成 { 'public/config/blog/<ns>/<lang>.json': content }
  const files = {};
  Object.keys(byLang).forEach((lang) => {
    const blogMap = handleBlogData(JSON.parse(JSON.stringify(byLang[lang])));
    Object.keys(blogMap).forEach((blogKey) => {
      files[`public/config/blog/${blogKey}/${lang}.json`] = JSON.stringify(
        blogMap[blogKey],
        null,
        0
      );
    });
  });
  const paths = Object.keys(files);
  console.log(
    `[2/5] 生成 ${paths.length} 个 JSON 文件（${
      Object.keys(byLang).length
    } 种语言）`
  );

  // 暂存模式：把内容写到 STAGE_DIR（文件名用序号，避免冒号），并输出 manifest.tsv（真实git路径\t暂存文件）。
  // 供 Windows 原生 git plumbing（hash-object + commit-tree）使用，绕开 PAT 写权限与 NTFS 冒号限制。
  if (process.env.STAGE_DIR) {
    const dir = process.env.STAGE_DIR;
    fs.mkdirSync(dir, { recursive: true });
    const manifest = [];
    paths.forEach((p, i) => {
      const fn = `f${i}.json`;
      fs.writeFileSync(path.join(dir, fn), files[p]);
      manifest.push(`${p}\t${fn}`);
    });
    fs.writeFileSync(path.join(dir, "manifest.tsv"), manifest.join("\n"));
    console.log(
      `[stage] 已写出 ${paths.length} 个文件 + manifest.tsv 到 ${dir}`
    );
    return;
  }

  console.log(`[3/5] 读取 ${OWNER}/${REPO}@${BRANCH} 基准 commit/tree ...`);
  const ref = await gh(
    "GET",
    `/repos/${OWNER}/${REPO}/git/ref/heads/${BRANCH}`
  );
  const baseCommitSha = ref.object.sha;
  const baseCommit = await gh(
    "GET",
    `/repos/${OWNER}/${REPO}/git/commits/${baseCommitSha}`
  );
  const baseTreeSha = baseCommit.tree.sha;

  console.log(`[4/5] 上传 ${paths.length} 个 blob 并建 tree ...`);
  const tree = [];
  let n = 0;
  for (const p of paths) {
    const blob = await gh("POST", `/repos/${OWNER}/${REPO}/git/blobs`, {
      content: Buffer.from(files[p], "utf8").toString("base64"),
      encoding: "base64"
    });
    tree.push({ path: p, mode: "100644", type: "blob", sha: blob.sha });
    if (++n % 20 === 0) console.log(`      ${n}/${paths.length}`);
  }
  const newTree = await gh("POST", `/repos/${OWNER}/${REPO}/git/trees`, {
    base_tree: baseTreeSha,
    tree
  });

  const msg =
    process.env.COMMIT_MSG ||
    "feat(blog): publish blog static data from backend (auto)";
  const commit = await gh("POST", `/repos/${OWNER}/${REPO}/git/commits`, {
    message: msg,
    tree: newTree.sha,
    parents: [baseCommitSha]
  });
  await gh("PATCH", `/repos/${OWNER}/${REPO}/git/refs/heads/${BRANCH}`, {
    sha: commit.sha
  });

  console.log(`[5/5] 已推送到 ${BRANCH}：${commit.sha}`);
  console.log(`      https://github.com/${OWNER}/${REPO}/commit/${commit.sha}`);
  console.log("      Cloudflare Pages 将自动部署；如需立即可见请清 CF 缓存。");
}

main().catch((e) => {
  console.error("发布失败：", e.message);
  process.exit(1);
});
