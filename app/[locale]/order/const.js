/** area cookie 为小写（如 us），ERP setting.pay.supportArea 为大写 ISO（如 US） */
import {
  PayAmericanExpressIcon,
  PayDiscoverIcon,
  PayMasterIcon,
  PayPaypalIcon,
  PayTransferIcon,
  PayVisaIcon,
  PayWechatIcon,
  PayZhifubaoIcon,
} from "@/components/Icon";

export function isPayAreaSupported(supportArea, area) {
  if (!Array.isArray(supportArea) || !area) return false;
  const normalized = String(area).toLowerCase();
  return supportArea.some(
    (code) => String(code).toLowerCase() === normalized
  );
}

// 各种支付方式的品牌 icon，全部内联 SVG 组件，无远端 PNG 依赖。
// iconList 是 React 组件数组；PayList 直接渲染 `<Cmp />`。
export const domesticPay = function ({ CONFIG, LANG }) {
  return [
    // {
    //   title: LANG["store.order.pay_info.wechat"],
    //   key: "wechat",
    //   iconList: [PayWechatIcon],
    //   description: "",
    // },
    // {
    //   title: LANG["store.order.pay_info.zhifubao"],
    //   key: "zhifubao",
    //   iconList: [PayZhifubaoIcon],
    //   description: "",
    // },
    // {
    //   title: LANG["store.order.pay_info.transfer"],
    //   key: "bank",
    //   description: LANG["store.order.pay_info.transfer_detail"]
    //     .split("${1}")
    //     .join(CONFIG["common.base"]?.company_name),
    //   iconList: [PayTransferIcon],
    // },
    {
      title: LANG["common.pay.pay_info.pay_list.paypal"],
      description: LANG["common.pay.pay_info.pay_list.paypal_detail"],
      key: "payPal",
      iconList: [PayPaypalIcon],
    },
  ];
};

export const foreignPay = function ({ CONFIG, LANG }) {
  const cardIcons = [
    PayVisaIcon,
    PayMasterIcon,
    PayAmericanExpressIcon,
    PayDiscoverIcon,
  ];

  return [
    {
      title: "Stripe",
      description:
        LANG["common.pay.pay_info.pay_list.stripe_detail"] ||
        "Pay securely with card, Apple Pay, or Google Pay.",
      key: "stripe",
      iconList: cardIcons,
    },
    {
      title: LANG["common.pay.pay_info.pay_list.paypal"],
      description: LANG["common.pay.pay_info.pay_list.paypal_detail"],
      key: "payPal",
      iconList: [PayPaypalIcon],
    },
    // {
    //   title: LANG['store.order.pay_info.transfer'],
    //   description: LANG['store.order.pay_info.transfer_detail'].split('${1}').join(CONFIG['company.basic.company_name']),
    //   key: 'bank',
    //   iconList: [PayTransferIcon],
    // },
  ];
};
