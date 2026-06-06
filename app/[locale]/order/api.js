import api from "../../request";

const request = {
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
  // Token登录
  tokenLogin: () => {
    return api.get("/user/tokenLogin");
  },
  // 确认Paypal
  confirmPaypal: (data) => {
    return api.post("/pay/confirmPaypal", data);
  },
};

export default request;
