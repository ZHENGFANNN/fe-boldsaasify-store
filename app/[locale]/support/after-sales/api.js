/** @format */

// ============================================================
// 售后(RMA) 运行时 API 封装
//   复用 @/request axios 实例（baseURL=NEXT_PUBLIC_HOST，自动注入 token cookie）。
//   - getOrderList         POST /pay/getOrderList         顾客订单列表（方式A 选订单）
//   - getProductList       GET  /config/getProduct        全语言全商品（方式B 选产品，公开）
//   - uploadMedia          POST /chat/upload              媒体上传（复用 LiveChat 端点，字段 "file"）
//   - createAfterService   POST /pay/createAfterService   创建工单
//   - getAfterServiceDetail POST /pay/getAfterServiceDetail 工单详情（后端已做归属校验）
// ============================================================

import Api from "@/request";

const request = {
  // 顾客订单列表：res.data.list[]（每单含 order_number/secret/order_status/order_list[]）
  getOrderList: () => {
    return Api.post("/pay/getOrderList");
  },

  // 全商品（公开，无需登录）：data.list 为全语言全商品，前端按 language 过滤 + sort_key 聚合
  getProductList: () => {
    return Api.get("/config/getProduct");
  },

  // 单个媒体上传（一次一个文件），返回 {url,name,type("image"|"video"|"file"),size}
  uploadMedia: (file) => {
    const form = new FormData();
    form.append("file", file);
    return Api.post("/chat/upload", form);
  },

  // 创建售后工单，成功返回新工单 id（res.data.id）
  createAfterService: (data) => {
    return Api.post("/pay/createAfterService", data);
  },

  // 工单详情，body {id}，返回全部字段含 status/media/产品/seller_reply
  // id 取自 URL query（字符串），后端 DTO 为 int + binding:required，
  // 必须转成数字，否则 JSON 绑定失败返回 10001「数据校验错误」→ detail 空白。
  getAfterServiceDetail: (id) => {
    return Api.post("/pay/getAfterServiceDetail", { id: Number(id) });
  },
};

export default request;
