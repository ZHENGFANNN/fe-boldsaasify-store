import api from '@/api'

const request = {
  // 获取订单列表
  getOrderList: (data) => {
    return api.post('/pay/getOrderList', data)
  },
  // 确认Paypal
  confirmPaypal: (data) => {
    return api.post('/pay/confirmPaypal', data)
  },
}

export default request
