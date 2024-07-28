/** @format */

const chalk = require("chalk");
const fs = require("fs");
const LANGUAGES = require("../src/config/LANGUAGE");
const api = require("./api");

// 处理Blog数据结构
function handleBlogData(list) {
  const obj = {
    blogBannerList: [],
    blogMap: {},
    blogSortMap: {},
  };

  list.forEach(({ sortInfo, ...item }) => {
    const blogSortInfo = sortInfo[0];
    item.blogSortInfo = blogSortInfo;

    // 处理bannerList
    if (item.recommend) {
      obj.blogBannerList.push(item);
    }

    // 处理Blog列表
    obj.blogMap[`${item.sort_key}:${item.key}`] = item;

    // 处理Blog分类
    obj.blogSortMap[item.sort_key] = {
      ...blogSortInfo,
      blogList: obj.blogSortMap[item.sort_key]
        ? [...obj.blogSortMap[item.sort_key].blogList, item]
        : [item],
    };
  });
  return obj;
}

// 获取Blog信息
const fetchBlog = async (times = 1, cookie = "") => {
  let error = false;
  const startTime = new Date().getTime();
  const fileDir = "./locale/blogData";
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
