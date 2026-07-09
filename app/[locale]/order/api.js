import api from "../../request";

const request = {
  // 订单计价预览（折扣由服务端计算）
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
  // 保存地址
  saveUserAddress: (data) => {
    return api.post("/user/saveUserAddress", data);
  },
  // 获取用户地址
  getUserAddress: () => {
    return api.get("/user/getUserAddress");
  },
  // 经纬度反地理编码（后端代理 Google）
  getAddressByLocation: (data) => {
    return api.post("/user/getAddressByLocation", data);
  },
  // 地址输入联想（后端代理 Google Places New）
  placeAutocomplete: (data) => {
    return api.post("/user/placeAutocomplete", data);
  },
  // 按 placeId 取结构化地址
  placeDetail: (data) => {
    return api.post("/user/placeDetail", data);
  },
  // 粘贴文本 AI 解析为结构化地址
  parseAddress: (data) => {
    return api.post("/user/parseAddress", data);
  },
  // 确认Paypal
  confirmPaypal: (data) => {
    return api.post("/pay/confirmPaypal", data);
  },
};

export default request;
