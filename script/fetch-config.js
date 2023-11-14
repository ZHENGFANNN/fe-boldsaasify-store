const chalk = require('chalk')
const fs = require('fs')
const LANGUAGES = require('../src/config/LANGUAGE')
const api = require('./api')

// 获取配置信息
const fetchConfig = async (times = 1, cookie = '') => {
  let error = false
  const startTime = new Date().getTime()
  const fileDir = './locale/configList'
  if (!fs.existsSync(fileDir)) fs.mkdirSync(fileDir, { recursive: true })
  console.log(`${chalk.yellow('【开始获取配置信息】')}`)
  await api
    .get('/config/getConfigList', {
      headers: {
        cookie,
      },
    })
    .then((res) => {
      let obj = {}
      res.data.list.forEach((item) => {
        LANGUAGES('list').forEach((lang) => {
          if (!obj[lang.value]) obj[lang.value] = {}
          if (item[lang.value] && item[lang.value] !== 'null') {
            try {
              obj[lang.value][item.code] = JSON.parse(item[lang.value])
            } catch {
              obj[lang.value][item.code] = item[lang.value]
            }
          } else {
            try {
              obj[lang.value][item.code] = JSON.parse(item.en)
            } catch {
              obj[lang.value][item.code] = item.en
            }
          }
        })
      })
      Object.keys(obj).map((item) => {
        const fileData = JSON.stringify(obj[item], null, 2)
        fs.writeFile(`${fileDir}/${item}.json`, fileData, (err) => {
          if (err) {
            console.log(`${chalk.red('【配置信息写入失败】')}`, err)
            error = true
          }
        })
      })
    })
    .catch((err) => {
      console.log(`${chalk.red('【配置信息获取失败】')}`, err)
      error = true
    })
    .finally(() => {
      console.log(`${chalk.green('【配置信息获取时长】')} ${new Date().getTime() - startTime}ms`)
      times = times + 1
      if (error && times < 4) {
        fetchConfig(times, cookie)
        console.log(`${chalk.red(`【!!!配置信息第${times}次获取!!!】`)}`)
      }
      if (error && times > 3) {
        console.log(`${chalk.red('【!!!配置信息连续三次获取失败!!!】')}`)
        throw '【!!!配置信息连续三次获取失败!!!】'
      }
    })
}

module.exports = fetchConfig
