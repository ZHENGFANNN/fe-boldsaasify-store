import api from "../../../../request";

const request = {
  previewOrder: (data) => {
    return api.post("/pay/previewOrder", data);
  },
  // 校验折扣码对当前商品是否适用（接口B）
  // 入参 { code, product_key, sort_key, combo_key, area_code, quantity }
  // 出参 data:{ valid, applicable, discount_amount, currency, error_code }
  validateDiscountCode: (data) => {
    return api.post("/pay/validateDiscountCode", data);
  },
  // 支付
  createOrder: (data) => {
    return api.post("/pay/createOrder", data);
  },
  // 确认Paypal
  confirmPaypal: (data) => {
    return api.post("/pay/confirmPaypal", data);
  },
  // 商品评论分页拉取（公开，无需登录）
  // 入参 { productKey, sortOrder(latest/rating_desc/rating_asc), current, pageSize }
  // 出参 data:{ list:[{id,rating,content,media:[{url,type,name}],seller_reply,email,created_time}], total }
  getProductReviews: (params) => {
    return api.get("/pay/getProductReviews", { params });
  },
};

export default request;
