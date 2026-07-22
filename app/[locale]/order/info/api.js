import api from "../../../request";

const request = {
  // 获取订单详情（游客/支付后凭 secret 查看）
  getOrderDetail: (data) => {
    return api.post("/pay/getOrderDetail", data);
  },
  // 获取订单列表
  getOrderList: (data) => {
    return api.post("/pay/getOrderList", data);
  },
  // 确认Paypal
  confirmPaypal: (data) => {
    return api.post("/pay/confirmPaypal", data);
  },
  // Stripe 二次支付：凭订单 secret 找回/重建支付会话
  stripeRepay: (data) => {
    return api.post("/pay/stripeRepay", data);
  },
  // 取消待支付订单
  cancelOrder: (data) => {
    return api.post("/pay/cancelOrder", data);
  },
  // 订单商品评论状态：GET /pay/getReviewStatus?order_number=xxx
  // 返回 data: [{ product_key, reviewed(bool), can_review(bool) }]，
  // can_review = 订单已完成 && 未评；reviewed 已评则该商品不可再评。
  getReviewStatus: (order_number) => {
    return api.get("/pay/getReviewStatus", { params: { order_number } });
  },
  // 提交商品评论：body { order_number, product_key, sort_key, combo_key?, rating(1-5), content, media[] }
  // media 元素 { url, type, name, size }。成功即已评、不可再评。
  submitReview: (data) => {
    return api.post("/pay/submitReview", data);
  },
  // 评论媒体上传（一次一个文件，复用 LiveChat 端点，字段 "file"）：
  // 返回 { url, name, type("image"|"video"|"file"), size }，与售后上传同口径。
  uploadReviewMedia: (file) => {
    const form = new FormData();
    form.append("file", file);
    form.append("scene", "review"); // 真实评论媒体 → public/review（公开展示+缓存）
    return api.post("/chat/upload", form);
  },
};

export default request;
