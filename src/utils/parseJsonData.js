export default function getJsonData(data) {
  try {
    return JSON.parse(data)
  } catch {
    console.log('【获取JSON数据失败】', data)
    return []
  }
}
