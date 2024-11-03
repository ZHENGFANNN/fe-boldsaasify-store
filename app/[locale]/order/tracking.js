export default {
  // 购买转化
  purchase: function ({ currency, value, discount, contents, type, from }) {
    dataLayer.push({
      event: "custom_click",
      click_type: "Purchase",
      click_data: {
        from,
        currency,
        value,
        contents,
        discount,
        type,
      },
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
    dataLayer.push({
      event: "custom_click",
      click_type: "InitiateCheckout",
      click_data: {
        currency,
        value,
        discount,
        contents,
        type,
        from,
      },
    });
  },
};
