"use client";

export default {
  // 加入购物车
  addToCart: function ({ productName }) {
    dataLayer.push({
      event: "custom_click",
      click_type: "AddToCart",
      click_data: productName,
    });
  },
  // 查看产品页
  viewContent: function ({ productName }) {
    dataLayer.push({
      event: "custom_click",
      click_type: "ViewProduct",
      click_data: productName,
    });
  },
  // 购买流程
  initiateCheckout: function ({ currency, value, discount, contents, type }) {
    dataLayer.push({
      event: "custom_click",
      click_type: "InitiateCheckout",
      click_data: {
        from: "product_page",
        currency,
        value,
        contents,
        discount,
        type,
      },
    });
  },
  // 购买转化
  purchase: function ({ currency, value, discount, contents, type }) {
    dataLayer.push({
      event: "custom_click",
      click_type: "Purchase",
      click_data: {
        from: "product_page",
        currency,
        value,
        contents,
        discount,
        type,
      },
    });
  },
  // Footer按钮
  clickProductFooterCombo: function ({ productName }) {
    dataLayer.push({
      event: "custom_click",
      click_type: "ProductFooterCombo",
      click_data: productName,
    });
  },
  clickProductFooterBuyBtn: function ({ productName }) {
    dataLayer.push({
      event: "custom_click",
      click_type: "ProductFooterBuy",
      click_data: productName,
    });
  },
};
