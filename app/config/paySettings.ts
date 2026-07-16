/** @format */

// ============================================================
// setting.pay 快照（构建期从 fetch-data/globalConfig/index.json 派生）。
//
// 数据来源：`yarn fetch-prod` → /config/getGlobalSettings → 落地
// fetch-data/globalConfig/index.json 的 `setting.pay` 字段。
//
// 与 languageSettings / marketSettings 同款：全局配置从磁盘读，
// 不走运行时接口 —— 避免 getRemoteConfig 那层缓存运维坑
// （进程级 memo + Next fetch 24h ISR 与 revalidateTag 之间的拼接漏洞）。
//
// 时效性：改后端 setting.pay 后需重新 `yarn fetch-prod` + 部署才生效，
// 与 setting.language / setting.markets 一致。
//
// 容错：首次 CI 构建时 globalConfig/index.json 可能尚未由 fetch-config 写入，
// 缺失时退回空配置，`isChannelEnabled` 一律 false，前台自动隐藏该通道。
// ============================================================

export interface PayMessage {
  [locale: string]: string;
}

export interface PayChannel {
  enabled?: boolean;
  weight?: number;
  supportArea?: string[];
  /** COD / Bank 面向客户展示的收款账户/到付文案（多语言） */
  message?: PayMessage;
}

export type PayChannelKey = "paypal" | "stripe" | "bank" | "cod";

export type PaySetting = Partial<Record<PayChannelKey, PayChannel>>;

interface GlobalConfig {
  "setting.pay"?: PaySetting;
  [key: string]: unknown;
}

const loadGlobalConfig = (): GlobalConfig => {
  try {
    // 与 languageSettings.ts 一致：webpack 需字面量 require 才能静态内联 JSON，
    // 变量路径会退化为 require-context 运行时查找、bundle 内查不到。
    return require("../../fetch-data/globalConfig/index.json") as GlobalConfig;
  } catch {
    return {};
  }
};

const globalConfig = loadGlobalConfig();

/** 完整 setting.pay 快照（后台配置了什么这里就是什么） */
export const paySetting: PaySetting = globalConfig["setting.pay"] || {};

/** area 参数为小写国家代码（us/hk），setting.pay.supportArea 存大写 ISO（US/HK）。 */
export function isPayAreaSupported(
  supportArea: string[] | undefined,
  area: string | undefined
): boolean {
  if (!area) return false;
  // supportArea 未配置 / 空数组 视为"未限制地区"，直接放行。
  if (!Array.isArray(supportArea) || supportArea.length === 0) return true;
  const normalized = String(area).toLowerCase();
  return supportArea.some((code) => String(code).toLowerCase() === normalized);
}

/** 判断某通道在指定地区是否启用（enabled + supportArea 双门控）。 */
export function isChannelEnabled(
  key: PayChannelKey,
  area: string | undefined
): boolean {
  const ch = paySetting[key];
  return ch?.enabled === true && isPayAreaSupported(ch?.supportArea, area);
}

/**
 * 取通道的多语言 message（面向客户展示的收款账户/到付文案）。
 * - locale 大小写归一（后端可能存 zh-CN，前端 locale 是 zh-cn）
 * - 缺失回退 en；均无则返回空串
 */
export function getChannelMessage(
  key: PayChannelKey,
  locale: string | undefined
): string {
  const msg = paySetting[key]?.message;
  if (!msg || typeof msg !== "object") return "";
  const lc: Record<string, string> = {};
  for (const k of Object.keys(msg)) lc[k.toLowerCase()] = msg[k];
  const target = String(locale || "").toLowerCase();
  const value = lc[target] || lc.en;
  return typeof value === "string" ? value.trim() : "";
}

export default {
  paySetting,
  isPayAreaSupported,
  isChannelEnabled,
  getChannelMessage,
};
