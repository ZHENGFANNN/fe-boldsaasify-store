import api from "../../../request";

const request = {
  // 退出登录
  loginOut: () => {
    return api.get(`/user/loginOut`);
  },
  // 修改用户密码
  editPassword: (data) => {
    return api.post(`/user/editPassword`, data);
  },
  // 修改用户信息
  saveUserInfo: (data) => {
    return api.post(`/user/saveUserInfo`, data);
  },
  // 新增用户地址
  saveUserAddress: (data) => {
    return api.post("/user/saveUserAddress", data);
  },
  getUserAddress: () => {
    return api.get("/user/getUserAddress");
  },
  deleteUserAddress: (data) => {
    return api.post("/user/deleteUserAddress", data);
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
  // 获取订单列表
  getOrderList: () => {
    return api.post("/pay/getOrderList");
  },
  // Token登陆
  tokenLogin: () => {
    return api.get("/user/tokenLogin");
  },
};

export default request;
