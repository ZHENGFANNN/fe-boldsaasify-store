import Api from "@/request";

export function getChatConfig() {
  return Api.get("/chat/config");
}

export function createChatSession(body) {
  return Api.post("/chat/session", body);
}

export function getChatMessages(params) {
  return Api.get("/chat/messages", { params });
}

export function sendChatMessage(body) {
  return Api.post("/chat/message", body);
}

export function createOfflineSession(body) {
  return Api.post("/chat/offline-session", body);
}

export function getOfflineThread(params) {
  return Api.get("/chat/offline-thread", { params });
}

export function sendOfflineMessage(body) {
  return Api.post("/chat/offline-message", body);
}

export function refreshWsToken(body) {
  return Api.post("/chat/ws-token", body);
}
