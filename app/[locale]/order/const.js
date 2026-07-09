/** area cookie 为小写（如 us），ERP setting.pay.supportArea 为大写 ISO（如 US） */
export function isPayAreaSupported(supportArea, area) {
  if (!Array.isArray(supportArea) || !area) return false;
  const normalized = String(area).toLowerCase();
  return supportArea.some(
    (code) => String(code).toLowerCase() === normalized
  );
}

export const domesticPay = function ({ CONFIG, LANG }) {
  return [
    // {
    //   title: LANG["store.order.pay_info.wechat"],
    //   key: "wechat",
    //   imgList: [`${process.env.NEXT_PUBLIC_FILE}/common/image/icon/pay-wechat.png`],
    //   description: "",
    // },
    // {
    //   title: LANG["store.order.pay_info.zhifubao"],
    //   key: "zhifubao",
    //   imgList: [`${process.env.NEXT_PUBLIC_FILE}/common/image/icon/pay-zhifubao.png`],
    //   description: "",
    // },
    // {
    //   title: LANG["store.order.pay_info.transfer"],
    //   key: "bank",
    //   description: LANG["store.order.pay_info.transfer_detail"]
    //     .split("${1}")
    //     .join(CONFIG["common.base"]?.company_name),
    //   imgList: [`${process.env.NEXT_PUBLIC_FILE}/common/image/icon/pay-transfer.png`],
    // },
    {
      title: LANG["common.pay.pay_info.pay_list.paypal"],
      description: LANG["common.pay.pay_info.pay_list.paypal_detail"],
      key: "payPal",
      imgList: [`${process.env.NEXT_PUBLIC_FILE}/common/image/icon/pay-paypal.png`],
    },
  ];
};

export const foreignPay = function ({ CONFIG, LANG }) {
  const cardIcons = [
    `${process.env.NEXT_PUBLIC_FILE}/common/image/icon/pay-visa.png`,
    `${process.env.NEXT_PUBLIC_FILE}/common/image/icon/pay-master.png`,
    `${process.env.NEXT_PUBLIC_FILE}/common/image/icon/pay-american-express.png`,
    `${process.env.NEXT_PUBLIC_FILE}/common/image/icon/pay-discover.png`,
  ];

  return [
    {
      title: "Stripe",
      description:
        LANG["common.pay.pay_info.pay_list.stripe_detail"] ||
        "Pay securely with card, Apple Pay, or Google Pay.",
      key: "stripe",
      imgList: cardIcons,
    },
    {
      title: LANG["common.pay.pay_info.pay_list.paypal"],
      description: LANG["common.pay.pay_info.pay_list.paypal_detail"],
      key: "payPal",
      imgList: [`${process.env.NEXT_PUBLIC_FILE}/common/image/icon/pay-paypal.png`],
    },
    // {
    //   title: LANG['store.order.pay_info.transfer'],
    //   description: LANG['store.order.pay_info.transfer_detail'].split('${1}').join(CONFIG['company.basic.company_name']),
    //   key: 'bank',
    //   imgList: [`${process.env.NEXT_PUBLIC_FILE}/common/image/icon/pay-transfer.png`],
    // },
  ];
};
