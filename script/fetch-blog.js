/** @format */

const chalk = require("chalk");
const fs = require("fs");
const api = require("./api");

const { languageList } = require("../app/config/LANGUAGE");

// 处理关联产品数据
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
  const obj = {};
  list.forEach(({ sortInfo, id, created_time, language, ...item }) => {
    // Blog分类
    const blogSortInfo = sortInfo[0];
    item.blogSortInfo = blogSortInfo;
    // 处理Blog文章内容
    item.content = addHeadTitleId(item.content);
    // 文章标题列表
    item.titleList = getHeadTitleList(item.content);

    // 处理sitemap
    if (!obj["sitemap"]) obj["sitemap"] = [];
    obj["sitemap"].push(`/blog/${item.sort_key}/${item.key}`);
    if (!obj["sitemap"].includes(`/blog/${item.sort_key}`))
      obj["sitemap"].push(`/blog/${item.sort_key}`);

    // 处理banner
    if (item.recommend) {
      if (!obj["banner"]) obj["banner"] = [];
      obj["banner"].push({
        image: item.image,
        title: item.title,
        key: item.key,
        sort_key: item.sort_key,
      });
    }

    // 处理Blog文章
    obj[`article:${item.sort_key}:${item.key}`] = {
      ...item,
      associateProduct: handleAProductList(item.associateProduct),
    };

    // 处理Blog分类
    const blogSortArticleItem = {
      image: item.image,
      title: item.title,
      key: item.key,
      sort_key: item.sort_key,
      updated_time: item.updated_time,
    };
    if (!obj[`sort`]) obj[`sort`] = {};
    obj[`sort`][`${item.sort_key}`] = {
      weight: blogSortInfo.weight,
      key: blogSortInfo.key,
      name: blogSortInfo.name,
      blogList: obj[`sort`][`${item.sort_key}`]
        ? [...obj[`sort`][`${item.sort_key}`].blogList, blogSortArticleItem]
        : [blogSortArticleItem],
    };
  });

  // 处理Layout（footer）
  obj["layout"] = {};
  obj["layout"]["footer"] = Object.keys(obj["sort"])
    .filter((_, index) => index < 8)
    .map((item) =>
      obj["sort"][item]
        ? {
            name: obj["sort"][item].name,
            key: obj["sort"][item].key,
          }
        : {}
    );
  obj["layout"]["nav"] = list
    .filter((_, index) => index < 8)
    .map(({ title, key, sort_key }) => ({ title, key, sort_key }));

  return obj;
}

// 获取Blog信息
const fetchBlog = async (times = 1, cookie = "") => {
  let error = false;
  const startTime = new Date().getTime();
  const fileDir = "./public/config/blog";
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

      languageList.forEach((lang) => {
        if (!obj[lang.value]) obj[lang.value] = obj["en"];
      });

      Object.keys(obj).forEach((languageKey) => {
        // !! 处理数据结构
        const blogMap = handleBlogData(obj[languageKey]);
        Object.keys(blogMap).forEach((blogKey) => {
          const fileData = JSON.stringify(blogMap[blogKey], null, 0);
          if (!fs.existsSync(`${fileDir}/${blogKey}`)) {
            fs.mkdirSync(`${fileDir}/${blogKey}`, { recursive: true });
          }
          fs.writeFileSync(
            `${fileDir}/${blogKey}/${languageKey}.json`,
            fileData,
            (err) => {
              if (err) {
                console.log(
                  `${chalk.red(`【Blog(${blogKey}) 写入失败】`)}`,
                  err
                );
                error = true;
              }
            }
          );
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
