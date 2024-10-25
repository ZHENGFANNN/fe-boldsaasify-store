/** @format */

const chalk = require("chalk");
const fs = require("fs");
const LANGUAGES = require("../app/config/LANGUAGE");
const api = require("./api");

// 处理鸡蛋的产品数据（关联产品）
function handleAssociateProductList(productList) {
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
        const { areaList = {}, ...newComboItem } = comboList[0] || {};
        item.comboItem = { areaList };
        return item;
      }
    );
  }
  return [];
}

// 处理鸡蛋的产品数据（分类产品）
function handleSimpleProductList(productList) {
  if (Array.isArray(productList) && productList.length > 0) {
    return productList.map(
      ({ reviewsList, image_list, reviews_num, reviews_score, ...item }) => {
        const totalScore = reviewsList?.reduce(
          (pre, cur) => pre + cur.score,
          0
        );
        item.reviewScore = totalScore / reviewsList?.length || reviews_score;
        item.reviewsNum = reviewsList?.length || reviews_num;
        item.image = image_list[0].src;
        return item;
      }
    );
  }
  return [];
}

// 处理产品数据
function handleProductData(productList) {
  const productMap = {};
  productList.forEach(({ goodSort, ...item }) => {
    const sortInfo = goodSort[0];
    // 处理sitemap
    if (!productMap["sitemap"]) productMap["sitemap"] = [];
    productMap["sitemap"].push(`/product/${item.sort_key}/${item.key}`);
    if (!productMap["sitemap"].includes(`/product/${item.sort_key}`))
      productMap["sitemap"].push(`/product/${item.sort_key}`);

    // 处理产品分类
    if (sortInfo.enabled) {
      if (!productMap["sort"]) productMap["sort"] = {};
      const simpleProduct = {
        key: item.key,
        sort_key: item.sort_key,
        name: item.name,
        reviewsList: item.reviewsList,
        image_list: item.image_list,
        reviews_num: item.reviews_num,
        reviews_score: item.reviews_score,
        comboList: item.comboList,
      };
      productMap["sort"][`${item.sort_key}`] = {
        ...sortInfo,
        goodList: productMap["sort"][`${item.sort_key}`]
          ? [
              ...productMap["sort"][`${item.sort_key}`].goodList,
              ...handleSimpleProductList([simpleProduct]),
            ]
          : handleSimpleProductList([simpleProduct]),
      };
    }
    // 处理产品详情
    productMap[`product:${item.sort_key}:${item.key}`] = {
      ...item,
      associateProduct: handleAssociateProductList(item.associateProduct),
      goodSort: goodSort.map((item) => ({ enabled: item.enabled })),
    };
  });

  // 处理Layout（footer）
  productMap["layout"] = {};
  productMap["layout"]["sortList"] = Object.keys(productMap["sort"]).map(
    (item) => {
      return productMap["sort"][item]
        ? {
            sub_title: productMap["sort"][item].name,
            href: `/#${productMap["sort"][item].key}`,
            img: productMap["sort"][item].image_src,
          }
        : {};
    }
  );
  productMap["layout"]["productList"] = productList
    .filter((item) => item.goodSort[0].enabled)
    .filter((_, index) => index < 8)
    .map((item) => ({
      sub_title: item.name,
      href: `/#${item.key}`,
      img: item.image_list?.[0]?.src,
    }));

  return productMap;
}

// 获取配置信息
const fetchConfig = async (times = 1, cookie = "") => {
  let error = false;
  const startTime = new Date().getTime();
  const fileDir = "./public/config/product";
  if (!fs.existsSync(fileDir)) fs.mkdirSync(fileDir, { recursive: true });
  console.log(`${chalk.yellow("【开始获取产品详细信息】")}`);
  await api
    .get("/config/getProduct", {
      headers: {
        cookie,
      },
    })
    .then((res) => {
      const obj = {};
      // 将每个语言的列表Map化
      res.data.list.forEach((item) => {
        if (!obj[item.language]) obj[item.language] = [];
        obj[item.language] = [...obj[item.language], item];
      });

      // 如果这个语言不存在配置就回拿到英文的，一旦配置过任何东西就拿不到
      LANGUAGES("list").forEach((lang) => {
        if (!obj[lang.value]) obj[lang.value] = obj["en"];
      });

      Object.keys(obj).map((languageKey) => {
        const productMap = handleProductData(obj[languageKey]);
        Object.keys(productMap).forEach((productKey) => {
          const fileData = JSON.stringify(productMap[productKey], null, 0);
          if (!fs.existsSync(`${fileDir}/${productKey}`)) {
            fs.mkdirSync(`${fileDir}/${productKey}`, { recursive: true });
          }
          fs.writeFileSync(
            `${fileDir}/${productKey}/${languageKey}.json`,
            fileData,
            (err) => {
              if (err) {
                console.log(
                  `${chalk.red(`【Product(${productKey}) 写入失败】`)}`,
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
      console.log(`${chalk.red("【产品详细信息获取失败】")}`, err);
      error = true;
    })
    .finally(() => {
      console.log(
        `${chalk.green("【产品详细信息获取时长】")} ${
          new Date().getTime() - startTime
        }ms`
      );
      times = times + 1;
      if (error && times < 4) {
        fetchConfig(times, cookie);
        console.log(`${chalk.red(`【!!!产品详细信息第${times}次获取!!!】`)}`);
      }
      if (error && times > 3) {
        console.log(`${chalk.red("【!!!产品详细信息连续三次获取失败!!!】")}`);
        throw "【!!!产品详细信息连续三次获取失败!!!】";
      }
    });
};

module.exports = fetchConfig;
