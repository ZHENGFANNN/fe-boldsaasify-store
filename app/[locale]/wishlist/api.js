/** @format */

// 收藏 / 愿望清单 运行时接口（be-user-service，@/request 拦截器自动注入 Bearer token）。
//   GET  /user/getCollections  → { code:0, data:{ list:[{ sortKey, productKey, createdTime }] } }
//   POST /user/saveCollection   body { sortKey, productKey } → { code:0, ... }
//   POST /user/deleteCollection body { sortKey, productKey } → { code:0, ... }

import api from "../../request";

export function getCollections() {
  return api.get(`/user/getCollections`);
}

export function saveCollection({ sortKey, productKey }) {
  return api.post(`/user/saveCollection`, { sortKey, productKey });
}

export function deleteCollection({ sortKey, productKey }) {
  return api.post(`/user/deleteCollection`, { sortKey, productKey });
}

const request = { getCollections, saveCollection, deleteCollection };
export default request;
