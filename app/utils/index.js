/**
 * @desc 函数防抖
 * @param func 回调函数
 * @param delay 延迟执行毫秒数
 */
export function debounce(func, delay) {
  let timer; // 定时器

  return function () {
    let context = this; // 记录 this 值,防止在回调函数中丢失
    let args = arguments; // 函数参数

    //如果定时器存在，则清除定时器(如果没有,也没必要进行处理)
    timer ? clearTimeout(timer) : null;

    timer = setTimeout(() => {
      // 防止 this 值变为 window
      func.apply(context, args);
    }, delay);
  };
}

/**
 * @desc 函数节流
 * @param func 回调函数
 * @param limit 时间限制
 */
export const throttle = (func, limit) => {
  let inThrottle; // 是否处于节流限制时间内

  return function () {
    const context = this;
    const args = arguments;

    // 跳出时间限制
    if (!inThrottle) {
      func.apply(context, args); // 执行回调
      inThrottle = true;
      // 开启定时器计时
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

/**
 * @desc 判断用户UA是否为Mob段
 * @param ua 时间限制
 */
export function isUserMobile(ua) {
  return /mobile|android|iphone|ipod|phone|ipad/i.test(ua.toLowerCase());
}

/**
 * @desc 保留2位小数点
 * @param value 值
 * @param unit 小数位
 */
export function roundToDecimalPlaces(value, unit = 100) {
  // 确保输入是数字类型
  if (typeof value !== "number") {
    value = parseFloat(value);
  }
  if (typeof unit !== "number") {
    unit = unit || 100;
  }

  return Math.round(value * unit) / unit;
}

/**
 * @desc 分割金额
 * @param value 值
 * @param unit 小数位
 */
export function formatCurrency(value, unit = 100) {
  // 确保输入是数字类型
  if (typeof value !== "number") {
    value = parseFloat(value);
  }
  if (typeof unit !== "number") {
    unit = unit || 100;
  }

  // 使用 toFixed 方法保留两位小数并转换为字符串
  let formattedAmount = new String(roundToDecimalPlaces(value, unit));

  // 添加千位分隔符
  formattedAmount = formattedAmount.replace(/\B(?=(\d{3})+(?!\d))/g, ",");

  // 添加货币符号等其他格式化需求
  // 例如，如果需要添加货币符号，可以这样处理：
  // formattedAmount = '$' + formattedAmount;

  return formattedAmount;
}
