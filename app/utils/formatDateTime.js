/** @format */

/**
 * 常见市场 area → IANA 时区（UTC 订单时间按站点地区展示）。
 * 未命中时客户端用浏览器时区，服务端回退 UTC。
 */
const AREA_TIMEZONE = {
  us: "America/New_York",
  ca: "America/Toronto",
  mx: "America/Mexico_City",
  gb: "Europe/London",
  ie: "Europe/Dublin",
  de: "Europe/Berlin",
  fr: "Europe/Paris",
  it: "Europe/Rome",
  es: "Europe/Madrid",
  nl: "Europe/Amsterdam",
  be: "Europe/Brussels",
  at: "Europe/Vienna",
  ch: "Europe/Zurich",
  se: "Europe/Stockholm",
  no: "Europe/Oslo",
  dk: "Europe/Copenhagen",
  fi: "Europe/Helsinki",
  pl: "Europe/Warsaw",
  pt: "Europe/Lisbon",
  au: "Australia/Sydney",
  nz: "Pacific/Auckland",
  jp: "Asia/Tokyo",
  kr: "Asia/Seoul",
  cn: "Asia/Shanghai",
  hk: "Asia/Hong_Kong",
  mo: "Asia/Macau",
  tw: "Asia/Taipei",
  sg: "Asia/Singapore",
  my: "Asia/Kuala_Lumpur",
  th: "Asia/Bangkok",
  in: "Asia/Kolkata",
  ae: "Asia/Dubai",
  sa: "Asia/Riyadh",
  il: "Asia/Jerusalem",
  br: "America/Sao_Paulo",
  ar: "America/Argentina/Buenos_Aires",
};

/**
 * 将站点 locale + area 解析为 Intl 可用的 BCP 47 标签，决定日期/时间书写习惯。
 */
export function resolveIntlLocale(locale, area) {
  const normalized = String(locale || "en")
    .trim()
    .replace(/_/g, "-")
    .toLowerCase();
  const region = String(area || "us").toUpperCase();

  if (normalized === "zh-cn" || normalized === "zh") {
    if (region === "HK" || region === "MO") return "zh-HK";
    if (region === "TW") return "zh-TW";
    return "zh-CN";
  }
  if (normalized === "zh-tw") return "zh-TW";
  if (normalized === "zh-hk") return "zh-HK";

  if (!normalized.includes("-")) {
    return `${normalized}-${region}`;
  }

  return normalized;
}

function resolveTimeZone(area) {
  const code = String(area || "")
    .trim()
    .toLowerCase();
  if (AREA_TIMEZONE[code]) return AREA_TIMEZONE[code];

  if (typeof Intl !== "undefined" && typeof Intl.DateTimeFormat === "function") {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch {
      // ignore
    }
  }

  return "UTC";
}

/**
 * 按 locale / area 格式化日期时间（含时分）。
 * @param {{ time: string | number | Date, locale?: string, area?: string }} params
 */
export function formatDateTime({ time, locale, area }) {
  if (time == null || time === "") return "";

  const date = time instanceof Date ? time : new Date(time);
  if (Number.isNaN(date.getTime())) return String(time);

  const intlLocale = resolveIntlLocale(locale, area);
  const timeZone = resolveTimeZone(area);

  try {
    return new Intl.DateTimeFormat(intlLocale, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      timeZone,
    }).format(date);
  } catch {
    try {
      return new Intl.DateTimeFormat("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        timeZone,
      }).format(date);
    } catch {
      return date.toISOString();
    }
  }
}

export default formatDateTime;
