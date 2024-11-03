export default {
  clickNavUser: () => {
    dataLayer.push({
      event: "custom_click",
      click_type: "NavUser",
    });
  },
  clickNavCart: () => {
    dataLayer.push({
      event: "custom_click",
      click_type: "NavCart",
    });
  },
  clickNavArea: () => {
    dataLayer.push({
      event: "custom_click",
      click_type: "NavArea",
    });
  },
  enterOrderForm: function ({ currency, value, contents }) {
    dataLayer.push({
      event: "custom_click",
      click_type: "CartModalCheckout",
      click_data: {
        currency,
        value,
        contents,
      },
    });
  },
};
