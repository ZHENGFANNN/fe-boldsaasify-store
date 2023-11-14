export default function formatPrice(price) {
  // 将价格转换为字符串
  price = price.toString()

  // 将价格分割为整数部分和小数部分（如果有）
  const parts = price.split('.')
  let integerPart = parts[0]
  const decimalPart = parts.length > 1 ? '.' + parts[1] : ''

  // 将整数部分添加千位分隔符
  const regex = /(\d+)(\d{3})/
  while (regex.test(integerPart)) {
    integerPart = integerPart.replace(regex, '$1,$2')
  }

  // 返回格式化后的价格
  return integerPart + decimalPart
}
