import Api from "@/request";

export function getChatConfig() {
  return Api.get("/chat/config");
}

export function getChatFaq(locale) {
  return Api.get("/chat/faq", { params: { locale } });
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

export function sendOfflineMessage(body) {
  return Api.post("/chat/offline-message", body);
}

export function refreshWsToken(body) {
  return Api.post("/chat/ws-token", body);
}
