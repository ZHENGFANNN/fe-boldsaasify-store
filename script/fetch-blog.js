/** @format */

const chalk = require("chalk");
const fs = require("fs");
const LANGUAGES = require("../src/config/LANGUAGE");
const api = require("./api");

// 获取文章标题
function getHeadTitleId(title) {
  return title
    .toLowerCase()
    .replace(/<.*?>(.*?)<.*?>/gis, "$1")
    .replace(/[\'\"?:\.]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

// 处理文章标题列表
function getHeadTitleList(html) {
  const headerRegex = /<h([23])[^>]*>(.*?)<\/h\1>/gis;
  const tagRegex = /<\/?[^>]+(>|$)/g; // Regex to match any HTML tag
  let matches = [];
  let match;
  while ((match = headerRegex.exec(html)) !== null) {
    // Get the full match (incl. tags) and strip HTML tags only for the inner content
    const contentWithTags = match[0];
    const tagName = `h${match[1]}`;
    const id = getHeadTitleId(match[2]);
    const content = contentWithTags.replace(tagRegex, "").trim();
    matches.push({ tag: tagName, content: content, id });
  }

  return matches;
}

// 添加文章标题ID
function addHeadTitleId(html) {
  const headerRegex = /<h([23])[^>]*>(.*?)<\/h\1>/gis;
  let match;
  while ((match = headerRegex.exec(html)) !== null) {
    // Get the full match (incl. tags) and strip HTML tags only for the inner content
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

// 处理Blog数据结构
function handleBlogData(list) {
  const obj = {
    blogBannerList: [],
    blogMap: {},
    blogSortMap: {},
  };

  list.forEach(({ sortInfo, id, created_time, language, ...item }) => {
    // Blog分类
    const blogSortInfo = sortInfo[0];
    item.blogSortInfo = blogSortInfo;
    // 处理Blog文章内容
    item.content = addHeadTitleId(item.content);
    // 文章标题列表
    item.titleList = getHeadTitleList(item.content);

    // 处理bannerList
    if (item.recommend) {
      obj.blogBannerList.push({
        image: item.image,
        title: item.title,
        key: item.key,
        sort_key: item.sort_key,
      });
    }

    // 处理Blog列表
    obj.blogMap[`${item.sort_key}:${item.key}`] = item;

    // 处理Blog分类
    const blogSortArticleItem = {
      image: item.image,
      title: item.title,
      key: item.key,
      sort_key: item.sort_key,
      updated_time: item.updated_time,
    };
    obj.blogSortMap[item.sort_key] = {
      weight: blogSortInfo.weight,
      key: blogSortInfo.key,
      name: blogSortInfo.name,
      blogList: obj.blogSortMap[item.sort_key]
        ? [...obj.blogSortMap[item.sort_key].blogList, blogSortArticleItem]
        : [blogSortArticleItem],
    };
  });
  return obj;
}

// 获取Blog信息
const fetchBlog = async (times = 1, cookie = "") => {
  let error = false;
  const startTime = new Date().getTime();
  const fileDir = "./public/config/blog-data";
  if (!fs.existsSync(fileDir)) fs.mkdirSync(fileDir, { recursive: true });
  console.log(`${chalk.yellow("【开始获取Blog】")}`);
  await api
    .get("/config/getBlog", {
      headers: {
        cookie,
      },
    })
    .then((res) => {
      const obj = {};
      // 原始数据 - 分语言
      res.data.list.forEach((item) => {
        if (!obj[item.language]) obj[item.language] = [];
        obj[item.language] = [...obj[item.language], item];
      });

      LANGUAGES("list").forEach((lang) => {
        if (!obj[lang.value]) obj[lang.value] = obj["en"];
      });

      Object.keys(obj).forEach((item) => {
        // !! 处理数据结构
        const fileData = JSON.stringify(handleBlogData(obj[item]), null, 2);
        fs.writeFileSync(`${fileDir}/${item}.json`, fileData, (err) => {
          if (err) {
            console.log(`${chalk.red("【blog写入失败】")}`, err);
            error = true;
          }
        });
      });
    })
    .catch((err) => {
      console.log(`${chalk.red("【blog获取失败】")}`, err);
      error = true;
    })
    .finally(() => {
      console.log(
        `${chalk.green("【Blog获取时长】")} ${
          new Date().getTime() - startTime
        }ms`
      );
      times = times + 1;
      if (error && times < 4) {
        fetchBlog(times, cookie);
        console.log(`${chalk.red(`【!!!Blog第${times}次获取!!!】`)}`);
      }
      if (error && times > 3) {
        console.log(`${chalk.red("【!!!Blog连续三次获取失败!!!】")}`);
        throw "【!!!Blog连续三次获取失败!!!】";
      }
    });
};

module.exports = fetchBlog;
