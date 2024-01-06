"use client";

export default {
  // 加入购物车
  addToCart: function ({ productName }) {
    window.fbq("track", "AddToCart", { content_name: productName });
  },
  // 查看产品页
  viewContent: function ({ productName }) {
    window.fbq("track", "ViewContent", {
      product_name: productName,
      content_type: "product",
    });
  },
  // 购买流程
  initiateCheckout: function ({ currency, value, discount, contents, type }) {
    window.fbq("track", "InitiateCheckout", {
      currency,
      value,
      contents,
      discount,
      type,
    });
  },
  // 购买转化
  purchase: function ({ currency, value, discount, contents, type }) {
    window.fbq("track", "Purchase", {
      currency,
      value,
      discount,
      contents,
      type,
    });
  },
};
