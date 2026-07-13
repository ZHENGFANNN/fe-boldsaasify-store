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
  // 查询当前商品作为「买X」命中的自动买赠（买X送Y）规则
  // 入参 { area_code, sort_key, product_key }
  // 出参 data:{ offers:[{ rule_id, title, buys_type, buys_value, gets_quantity,
  //   gets_discount_type, gets_discount_value, ends_at, get_products:[{ sort_key,
  //   product_key, combo_key, product_price, currency }] }] }
  getProductBxgyOffer: (data) => {
    return api.post("/pay/getProductBxgyOffer", data);
  },
};

export default request;
