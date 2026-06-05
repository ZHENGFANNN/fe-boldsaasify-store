/**
 * axios封装
 * 请求拦截、响应拦截、错误统一处理
 *
 * @format
 */

const axios = require("axios");

const serviceBase = process.env.NEXT_PUBLIC_HOST;
const instance = axios.create({
  baseURL: serviceBase,
  timeout: 30000,
  withCredentials: false,
  proxy: false,
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
    return Promise.reject(error);
  }
);

module.exports = instance;
