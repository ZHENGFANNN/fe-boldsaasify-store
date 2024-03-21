export default function formatCurrency(amount) {
  // 确保输入是数字类型
  if (typeof amount !== "number") {
    amount = parseFloat(amount);
  }

  // 使用 toFixed 方法保留两位小数并转换为字符串
  let formattedAmount = amount.toFixed(2).toString();

  // 添加千位分隔符
  formattedAmount = formattedAmount.replace(/\B(?=(\d{3})+(?!\d))/g, ",");

  // 添加货币符号等其他格式化需求
  // 例如，如果需要添加货币符号，可以这样处理：
  // formattedAmount = '$' + formattedAmount;

  return formattedAmount;
}
