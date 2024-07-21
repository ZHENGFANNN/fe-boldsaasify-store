import api from "@/api";

const request = {
  // 支付
  createOrder: (data) => {
    return api.post("/pay/createOrder", data);
  },
  // 确认Paypal
  confirmPaypal: (data) => {
    return api.post("/pay/confirmPaypal", data);
  },
};

export default request;
