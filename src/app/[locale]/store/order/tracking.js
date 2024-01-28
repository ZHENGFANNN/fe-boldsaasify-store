import commonTracking from "@/utils/commonTracking";

export default {
  // 购买转化
  purchase: function ({ currency, value, discount, contents, type, from }) {
    commonTracking("Purchase", {
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
    commonTracking("InitiateCheckout", {
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
    commonTracking("EnterOrderDetail", {
      currency,
      value,
      contents,
      discount,
    });
  },
};
