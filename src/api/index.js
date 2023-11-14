/**
 * axios封装
 * 请求拦截、响应拦截、错误统一处理
 */
import axios from 'axios'
// 创建axios实例

const instance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_HOST,
  timeout: 30000,
  withCredentials: true,
})

/**
 * 响应拦截器
 */
instance.interceptors.response.use(
  // 请求成功
  (res) => {
    const { data, status } = res
    if (status === 200) {
      return Promise.resolve(data)
    } else {
      return Promise.reject(data)
    }
  },
  // 请求失败
  (error) => {
    const { status } = error.response
    if (status === 403) window.location.href = '/user/login'
    return Promise.reject(error)
  }
)

module.exports = instance
