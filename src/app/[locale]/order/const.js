export const domesticPay = function ({ CONFIG, LANG }) {
  return [
    // {
    //   title: LANG["store.order.pay_info.wechat"],
    //   key: "wechat",
    //   imgList: [`${process.env.NEXT_PUBLIC_FILE}/image/icon/pay-wechat.png`],
    //   description: "",
    // },
    // {
    //   title: LANG["store.order.pay_info.zhifubao"],
    //   key: "zhifubao",
    //   imgList: [`${process.env.NEXT_PUBLIC_FILE}/image/icon/pay-zhifubao.png`],
    //   description: "",
    // },
    // {
    //   title: LANG["store.order.pay_info.transfer"],
    //   key: "bankTransfoer",
    //   description: LANG["store.order.pay_info.transfer_detail"]
    //     .split("${1}")
    //     .join(CONFIG["company.basic.company_name"]),
    //   imgList: [`${process.env.NEXT_PUBLIC_FILE}/image/icon/pay-transfer.png`],
    // },
    {
      title: LANG["store.order.pay_info.paypal"],
      description: LANG["store.order.pay_info.paypal_detail"],
      key: "payPal",
      imgList: [`${process.env.NEXT_PUBLIC_FILE}/image/icon/pay-paypal.png`],
    },
  ];
};

export const foreignPay = function ({ CONFIG, LANG }) {
  return [
    // {
    //   title: LANG["store.order.pay_info.credit_card"],
    //   key: "creditCard",
    //   imgList: [
    //     `${process.env.NEXT_PUBLIC_FILE}/image/icon/pay-visa.png`,
    //     `${process.env.NEXT_PUBLIC_FILE}/image/icon/pay-master.png`,
    //     `${process.env.NEXT_PUBLIC_FILE}/image/icon/pay-maestro.png`,
    //     `${process.env.NEXT_PUBLIC_FILE}/image/icon/pay-american-express.png`,
    //     `${process.env.NEXT_PUBLIC_FILE}/image/icon/pay-diners-clubs.png`,
    //     `${process.env.NEXT_PUBLIC_FILE}/image/icon/pay-discover.png`,
    //     `${process.env.NEXT_PUBLIC_FILE}/image/icon/pay-jcb.png`,
    //     `${process.env.NEXT_PUBLIC_FILE}/image/icon/pay-unionpay.png`,
    //   ],
    // },
    // {
    //   title: LANG['store.order.pay_info.pay_after_arrival'],
    //   description: LANG['store.order.pay_info.pay_after_arrival_desc'],
    //   key: 'COD',
    //   // imgList: [`${process.env.NEXT_PUBLIC_FILE}/image/icon/pay-paypal.png`],
    // },
    {
      title: LANG["store.order.pay_info.paypal"],
      description: LANG["store.order.pay_info.paypal_detail"],
      key: "payPal",
      imgList: [`${process.env.NEXT_PUBLIC_FILE}/image/icon/pay-paypal.png`],
    },
    // {
    //   title: LANG['store.order.pay_info.transfer'],
    //   description: LANG['store.order.pay_info.transfer_detail'].split('${1}').join(CONFIG['company.basic.company_name']),
    //   key: 'bankTransfer',
    //   imgList: [`${process.env.NEXT_PUBLIC_FILE}/image/icon/pay-transfer.png`],
    // },
  ];
};
