/**
 * axios封装
 * 请求拦截、响应拦截、错误统一处理
 */
import axios from "axios";
import Cookies from "js-cookie";
// 创建axios实例

const instance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_HOST,
  timeout: 30000,
  withCredentials: true,
});

/**
 * 请求拦截器
 * 后端鉴权只认 Authorization: Bearer <token>，这里从 token cookie 自动注入，
 * 否则登录后所有需要登录态的接口（tokenLogin / 地址 / 订单）都会被当成游客。
 */
instance.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = Cookies.get("token");
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

/**
 * 响应拦截器
 */
instance.interceptors.response.use(
  // 请求成功
  (res) => {
    const { data, status } = res;
    if (status === 200) {
      return Promise.resolve(data);
    } else {
      return Promise.reject(data);
    }
  },
  // 请求失败
  (error) => {
    // 无 response = 网络/CORS/超时（含 nginx keepalive_timeout 到期后浏览器复用
    // 已失效 keep-alive socket 的 Chrome "Stalled" → 卡到 TCP 超时 ~30s）。
    // 仅对幂等 GET 自动重试一次：重试会新建连接，绕开那条 dead socket。
    // POST（下单/支付/发消息）绝不自动重试，避免重复提交/重复扣款。
    const config = error?.config;
    const isNetworkError = !error?.response;
    const isIdempotent = (config?.method || "").toLowerCase() === "get";
    if (config && isNetworkError && isIdempotent && !config.__staleRetry) {
      config.__staleRetry = true;
      return instance(config);
    }
    // 旧代码直接解构 error.response 会抛 TypeError，把真实错误盖成
    // "Cannot destructure property 'status'"，进而让 PayPal createOrder
    // 拿不到订单号报 "Expected an order id"。这里做空值保护。
    const status = error?.response?.status;
    if (status === 403) window.location.href = "/user/login";
    return Promise.reject(error);
  }
);

export default instance;
