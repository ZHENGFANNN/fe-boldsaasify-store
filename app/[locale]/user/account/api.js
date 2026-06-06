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
