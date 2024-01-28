import commonTracking from "@/utils/commonTracking";
export default {
  // 进入帐单页
  enterOrderForm: function ({ currency, value, contents }) {
    commonTracking("enter_order_page", {
      from: "cart_page",
      currency,
      value,
      contents,
    });
  },
};
