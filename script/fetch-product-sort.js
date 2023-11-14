const chalk = require('chalk')
const fs = require('fs')
const LANGUAGES = require('../src/config/LANGUAGE')
const api = require('./api')

// 获取商品分类信息
const fetchGoodsSort = async (times = 1, cookie = '') => {
  let error = false
  const startTime = new Date().getTime()
  const fileDir = './locale/productSort'
  if (!fs.existsSync(fileDir)) fs.mkdirSync(fileDir, { recursive: true })
  console.log(`${chalk.yellow('【开始获取商品分类】')}`)
  await api
    .get('/config/getGoodsSort', {
      headers: {
        cookie,
      },
    })
    .then((res) => {
      const obj = {}
      res.data.list.forEach((item) => {
        if (!obj[item.language]) obj[item.language] = []
        obj[item.language] = [...obj[item.language], item]
      })

      LANGUAGES('list').forEach((lang) => {
        if (!obj[lang.value]) obj[lang.value] = obj['en']
      })

      Object.keys(obj).map((item) => {
        const fileData = JSON.stringify(obj[item], null, 2)
        fs.writeFile(`${fileDir}/${item}.json`, fileData, (err) => {
          if (err) {
            console.log(`${chalk.red('【商品分类写入失败】')}`, err)
            error = true
          }
        })
      })
    })
    .catch((err) => {
      console.log(`${chalk.red('【商品分类获取失败】')}`, err)
      error = true
    })
    .finally(() => {
      console.log(`${chalk.green('【商品分类获取时长】')} ${new Date().getTime() - startTime}ms`)
      times = times + 1
      if (error && times < 4) {
        fetchGoodsSort(times, cookie)
        console.log(`${chalk.red(`【!!!商品分类第${times}次获取!!!】`)}`)
      }
      if (error && times > 3) {
        console.log(`${chalk.red('【!!!商品分类连续三次获取失败!!!】')}`)
        throw '【!!!商品分类连续三次获取失败!!!】'
      }
    })
}

module.exports = fetchGoodsSort
