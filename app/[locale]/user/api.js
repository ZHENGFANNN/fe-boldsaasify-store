import api from "../../request";

const request = {
  userLogin: (data) => {
    return api.post(`/user/login`, data);
  },
  userRegister: (data) => {
    return api.post(`/user/register`, data);
  },
  // Google 登录：提交 Google ID Token(credential) + area/language，换取本站登录态
  userGoogleLogin: (data) => {
    return api.post(`/user/googleLogin`, data);
  },
  // 人工找回：提交邮箱 + 联系方式，落库为 ERP 工单由后台处理
  forgetPassword: (data) => {
    return api.post(`/user/forgetPassword`, data);
  },
  // 自助重置第 1 步：校验邮箱并发送带 token 的重置链接到邮箱
  verifyForgetPassword: (data) => {
    return api.post(`/user/verifyforgetPassword`, data);
  },
  // 自助重置第 2 步：凭邮件 token 设置新密码
  resetPassword: (data) => {
    return api.post(`/user/resetPassword`, data);
  },
};

export default request;
