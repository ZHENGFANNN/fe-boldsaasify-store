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
 * @desc 由 currency_unit(精度因子) 推导应保留的小数位数
 *       unit 语义：10^n 的因子 —— 100 => 2 位小数, 10 => 1 位, 1 => 0 位(整数)
 * @param unit 精度因子(currency_unit)，默认 100
 * @returns 小数位数(>=0 的整数)
 */
export function currencyDecimals(unit = 100) {
  if (typeof unit !== "number" || !isFinite(unit) || unit <= 0) {
    unit = 100;
  }
  return Math.max(0, Math.round(Math.log10(unit)));
}

/**
 * @desc 分割金额：按 currency_unit 配置的精度固定小数位并加千位分隔符
 *       - unit=100 => 始终 2 位小数(如 1200 => "1,200.00")
 *       - unit=1   => 整数(如 180000 => "180,000")
 * @param value 值
 * @param unit 精度因子(currency_unit)
 */
export function formatCurrency(value, unit = 100) {
  // 确保输入是数字类型
  if (typeof value !== "number") {
    value = parseFloat(value);
  }
  if (!isFinite(value)) {
    value = 0;
  }

  const decimals = currencyDecimals(unit);

  // 按配置的小数位固定精度(toFixed 会保留末尾的 0)
  let formattedAmount = value.toFixed(decimals);

  // 仅对整数部分添加千位分隔符，保留小数部分不动
  const [intPart, decPart] = formattedAmount.split(".");
  const withSeparator = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  formattedAmount = decPart !== undefined ? `${withSeparator}.${decPart}` : withSeparator;

  return formattedAmount;
}

/**
 * @desc 阿里云 OSS 图片处理：把 m_pad(等比缩放后用底色填充留白) 改成
 *       m_fill(等比缩放铺满目标框后居中裁切)，并去掉只对 pad 有效的 color_ 参数，
 *       让非正方形产品图占满正方形卡片、不再出现白边。
 * @param url 图片地址(可能带 ?x-oss-process=image/resize,m_pad,w_1000,h_1000,color_FFFFFF)
 */
export function fillOssImage(url) {
  if (typeof url !== "string" || !url.includes("x-oss-process")) return url;
  return url
    .replace(/m_pad/g, "m_fill")
    .replace(/,color_[0-9a-fA-F]+/g, "");
}

/**
 * @desc format JSON
 */
export function getJsonData(data) {
  try {
    return JSON.parse(data);
  } catch {
    console.log("【获取JSON数据失败】", data);
    return [];
  }
}

export { formatDateTime, resolveIntlLocale } from "./formatDateTime";
