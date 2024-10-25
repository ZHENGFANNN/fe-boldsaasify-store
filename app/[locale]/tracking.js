import commonTracking from "../utils/commonTracking";

export default {
  // 点击轮播图
  clickBannerLink: ({ link }) => {
    commonTracking("ClickBannerLink", {
      link,
    });
  },
  // 来自首页的点击，进入产品页
  enterProduct: function ({ productName }) {
    commonTracking("ViewProduct", {
      from: "store_page",
      product_name: productName,
    });
  },
};
