"use client";
import commonTracking from "@/utils/commonTracking";

export default {
  // 加入购物车
  addToCart: function ({ productName }) {
    commonTracking("add_to_cart", {
      content_name: productName,
    });
  },
  // 查看产品页
  viewContent: function ({ productName }) {
    commonTracking("view_product", {
      product_name: productName,
    });
  },
  // 购买流程
  initiateCheckout: function ({ currency, value, discount, contents, type }) {
    commonTracking("create_order", {
      from: "product_page",
      currency,
      value,
      contents,
      discount,
      type,
    });
  },
  // 购买转化
  purchase: function ({ currency, value, discount, contents, type }) {
    commonTracking("purchase", {
      from: "product_page",
      currency,
      value,
      contents,
      discount,
      type,
    });
  },
  // Footer按钮
  clickFooterBtn: function ({ productName }) {
    commonTracking("click_product_footer_btn", {
      product_name: productName,
    });
  },
};
