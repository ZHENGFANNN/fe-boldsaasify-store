/** area cookie 为小写（如 us），ERP setting.pay.supportArea 为大写 ISO（如 US） */
import {
  PayAmericanExpressIcon,
  PayDiscoverIcon,
  PayMasterIcon,
  PayPaypalIcon,
  PayTransferIcon,
  PayVisaIcon,
} from "@/components/Icon";

export function isPayAreaSupported(supportArea, area) {
  if (!area) return false;
  // supportArea 未配置 / 空数组 视为"未限制地区"，直接放行；
  // 只有显式给出地区列表时才做过滤。这样避免主开关启用后因遗留脏数据（supportArea 缺失或 []）
  // 在前台被卡住，用户 workaround 只需在 ERP 里正常保存一次。
  if (!Array.isArray(supportArea) || supportArea.length === 0) return true;
  const normalized = String(area).toLowerCase();
  return supportArea.some(
    (code) => String(code).toLowerCase() === normalized
  );
}

/**
 * 支付方式默认列表。
 * - title/description 取 LANG，缺 key 时用中英文 fallback。
 * - cod/bank 的 description 优先用后台 setting.pay 里配置的 message[locale]（在 Main 里合并）。
 * - key 与 setting.pay 通道键（小写）对应：paypal→payPal 特例（历史遗留），其余同名。
 */
function baseList({ LANG }) {
  return [
    {
      title: "Stripe",
      description:
        LANG["common.pay.pay_info.pay_list.stripe_detail"] ||
        "Pay securely with card, Apple Pay, or Google Pay.",
      key: "stripe",
      iconList: [
        PayVisaIcon,
        PayMasterIcon,
        PayAmericanExpressIcon,
        PayDiscoverIcon,
      ],
    },
    {
      title: LANG["common.pay.pay_info.pay_list.paypal"] || "PayPal",
      description: LANG["common.pay.pay_info.pay_list.paypal_detail"],
      key: "payPal",
      iconList: [PayPaypalIcon],
    },
    {
      title:
        LANG["common.pay.pay_info.pay_list.cod"] ||
        LANG["store.order.pay_info.cod"] ||
        "Cash on Delivery",
      description: LANG["common.pay.pay_info.pay_list.cod_detail"] || "",
      key: "cod",
      iconList: [],
    },
    {
      title:
        LANG["common.pay.pay_info.pay_list.bank"] ||
        LANG["store.order.pay_info.transfer"] ||
        "Bank Transfer",
      description: LANG["common.pay.pay_info.pay_list.bank_detail"] || "",
      key: "bank",
      iconList: [PayTransferIcon],
    },
  ];
}

export const domesticPay = baseList;
export const foreignPay = baseList;
