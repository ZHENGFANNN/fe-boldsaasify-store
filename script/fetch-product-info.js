const chalk = require('chalk')
const fs = require('fs')
const LANGUAGES = require('../src/config/LANGUAGE')
const api = require('./api')

// 获取配置信息
const fetchConfig = async (times = 1, cookie = '') => {
  let error = false
  const startTime = new Date().getTime()
  const fileDir = './locale/productList'
  if (!fs.existsSync(fileDir)) fs.mkdirSync(fileDir, { recursive: true })
  console.log(`${chalk.yellow('【开始获取产品详细信息】')}`)
  await api
    .get('/config/getGoodsContent', {
      headers: {
        cookie,
      },
    })
    .then((res) => {
      const obj = {}
      // 将每个语言的列表Map化
      res.data.list.forEach((item) => {
        if (!obj[item.language]) obj[item.language] = []
        obj[item.language] = [...obj[item.language], item]
      })

      // 如果这个语言不存在配置就回拿到英文的，一旦配置过任何东西就拿不到
      LANGUAGES('list').forEach((lang) => {
        if (!obj[lang.value]) obj[lang.value] = obj['en']
      })

      Object.keys(obj).map((item) => {
        const fileData = JSON.stringify(obj[item], null, 2)
        fs.writeFileSync(`${fileDir}/${item}.json`, fileData)
      })
    })
    .catch((err) => {
      console.log(`${chalk.red('【产品详细信息获取失败】')}`, err)
      error = true
    })
    .finally(() => {
      console.log(`${chalk.green('【产品详细信息获取时长】')} ${new Date().getTime() - startTime}ms`)
      times = times + 1
      if (error && times < 4) {
        fetchConfig(times, cookie)
        console.log(`${chalk.red(`【!!!产品详细信息第${times}次获取!!!】`)}`)
      }
      if (error && times > 3) {
        console.log(`${chalk.red('【!!!产品详细信息连续三次获取失败!!!】')}`)
        throw '【!!!产品详细信息连续三次获取失败!!!】'
      }
    })
}

module.exports = fetchConfig
