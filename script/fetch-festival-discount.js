const chalk = require("chalk");
const fs = require("fs");
const LANGUAGES = require("../src/config/LANGUAGE");
const api = require("./api");

// 获取产品优惠
const fetchFestivalDiscount = async (times = 1, cookie = "") => {
  let error = false;
  const startTime = new Date().getTime();
  const fileDir = "./locale/productDiscount/festival";
  if (!fs.existsSync(fileDir)) fs.mkdirSync(fileDir, { recursive: true });
  console.log(`${chalk.yellow("【开始获取产品折扣】")}`);
  await api
    .get("/config/getFestivalDiscount", {
      headers: {
        cookie,
      },
    })
    .then((res) => {
      const data = res?.data || [];
      const fileData = JSON.stringify(data, null, 2);
      fs.writeFile(`${fileDir}/index.json`, fileData, (err) => {
        if (err) {
          console.log(`${chalk.red("【产品折扣写入失败】")}`, err);
          error = true;
        }
      });
    })
    .catch((err) => {
      console.log(`${chalk.red("【产品折扣获取失败】")}`, err);
      error = true;
    })
    .finally(() => {
      console.log(
        `${chalk.green("【产品折扣获取时长】")} ${
          new Date().getTime() - startTime
        }ms`
      );
      times = times + 1;
      if (error && times < 4) {
        fetchFestivalDiscount(times, cookie);
        console.log(`${chalk.red(`【!!!产品折扣第${times}次获取!!!】`)}`);
      }
      if (error && times > 3) {
        console.log(`${chalk.red("【!!!产品折扣连续三次获取失败!!!】")}`);
        throw "【!!!产品折扣连续三次获取失败!!!】";
      }
    });
};

module.exports = fetchFestivalDiscount;
