/** @format */

const chalk = require("chalk");
const fs = require("fs");
const api = require("./api");

const { languageList } = require("../app/config/languageSettings");

// 获取多语言信息
const fetchLanguage = async (times = 1, cookie = "") => {
  let error = false;
  const startTime = new Date().getTime();
  const fileDir = "./fetch-data/languageList";
  if (!fs.existsSync(fileDir)) fs.mkdirSync(fileDir, { recursive: true });
  console.log(`${chalk.yellow("【开始获取文案】")}`);
  await api
    .get("/config/getLanguage", {
      headers: {
        cookie,
      },
    })
    .then((res) => {
      let obj = {};
      res.data.list.forEach((item) => {
        languageList.forEach((lang) => {
          if (!obj[lang.value]) obj[lang.value] = {};
          if (item[lang.value] && item[lang.value] !== "null") {
            obj[lang.value][item.code] = item[lang.value];
          } else {
            obj[lang.value][item.code] = item["en"];
          }
        });
      });
      Object.keys(obj).map((item) => {
        const fileData = JSON.stringify(obj[item], null, 0);
        fs.writeFile(`${fileDir}/${item}.json`, fileData, (err) => {
          if (err) {
            console.log(`${chalk.red("【文案写入失败】")}`, err);
            error = true;
          }
        });
      });
    })
    .catch((err) => {
      console.log(`${chalk.red("【文案获取失败】")}`, err);
      error = true;
    })
    .finally(() => {
      console.log(
        `${chalk.green("【文案获取时长】")} ${
          new Date().getTime() - startTime
        }ms`
      );
      times = times + 1;
      if (error && times < 4) {
        fetchLanguage(times, cookie);
        console.log(`${chalk.red(`【!!!文案第${times}次获取!!!】`)}`);
      }
      if (error && times > 3) {
        console.log(`${chalk.red("【!!!文案连续三次获取失败!!!】")}`);
        throw "【!!!文案连续三次获取失败!!!】";
      }
    });
};

module.exports = fetchLanguage;
