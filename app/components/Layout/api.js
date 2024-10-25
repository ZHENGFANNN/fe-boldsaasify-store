import api from "../../request";

const request = {
  loginOut: () => {
    return api.get(`/user/loginOut`);
  },
  subscribeUser: (data) => {
    return api.post(`/user/subscribeUser`, data);
  },
};

export default request;
