import api from "../../request";

const request = {
  userLogin: (data) => {
    return api.post(`/user/login`, data);
  },
  userRegister: (data) => {
    return api.post(`/user/register`, data);
  },
  forgetPassword: (data) => {
    return api.post(`/user/forgetPassword`, data);
  },
};

export default request;
