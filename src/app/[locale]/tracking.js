import commonTracking from "@/utils/commonTracking";

export default {
  // 点击轮播图
  clickBannerLink: ({ link }) => {
    commonTracking("click_store_banner", {
      link,
    });
  },
  // 来自首页的点击，进入产品页
  enterProduct: function ({ productName }) {
    commonTracking("view_product", {
      from: "store_page",
      product_name: productName,
    });
  },
};
