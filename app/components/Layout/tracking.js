import commonTracking from "../../utils/commonTracking";

export default {
  // 点击商城
  clickNavStoreBtn: () => {
    commonTracking("ClickNavStoreBtn");
  },
  // 进入帐单页
  enterOrderForm: function ({ currency, value, contents }) {
    commonTracking("EnterOrderForm", {
      from: "cart_page",
      currency,
      value,
      contents,
    });
  },
};
