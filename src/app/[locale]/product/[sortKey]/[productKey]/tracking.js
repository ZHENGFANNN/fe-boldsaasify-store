"use client";
import commonTracking from "@/utils/commonTracking";

export default {
  // 加入购物车
  addToCart: function ({ productName }) {
    commonTracking("AddToCart", {
      content_name: productName,
    });
  },
  // 查看产品页
  viewContent: function ({ productName }) {
    commonTracking("ViewProduct", {
      product_name: productName,
    });
  },
  // 购买流程
  initiateCheckout: function ({ currency, value, discount, contents, type }) {
    commonTracking("InitiateCheckout", {
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
    commonTracking("Purchase", {
      from: "product_page",
      currency,
      value,
      contents,
      discount,
      type,
    });
  },
  // Footer按钮
  clickProductFooterBtn: function ({ productName, type }) {
    commonTracking("clickProductFooterBtn", {
      product_name: productName,
      type,
    });
  },
};
