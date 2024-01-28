import commonTracking from "@/utils/commonTracking";

export default {
  // 购买转化
  purchase: function ({ currency, value, discount, contents, type, from }) {
    commonTracking("purchase", {
      from,
      currency,
      value,
      contents,
      discount,
      type,
    });
  },
  // 进入购买流程
  initiateCheckout: function ({
    currency,
    value,
    discount,
    contents,
    type,
    from,
  }) {
    commonTracking("create_order", {
      from,
      currency,
      value,
      contents,
      discount,
      type,
    });
  },
  // 进入订单详情页
  enterOrderDetail: function ({ currency, value, discount, contents }) {
    window.fbq("track", "进入订单详情页", {
      currency,
      value,
      contents,
      discount,
    });
  },
};
