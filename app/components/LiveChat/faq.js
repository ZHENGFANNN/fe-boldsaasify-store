/** 写死 FAQ（Phase 1 不做后台配置） */
export const FAQ_COPY = {
  en: {
    panelTitle: "Help Center",
    panelStatusOnline: "Agents available",
    panelStatusOffline: "Agents offline",
    intro: "Browse common questions below, or talk to our team.",
    transferBtn: "Talk to an agent",
    backToFaq: "Back to FAQ",
    offlineIntro:
      "Our team is currently offline. Leave your contact details and we will reply by email as soon as possible.",
    offlineBanner:
      "Our agents are currently offline. You can leave a message and we will reply by email.",
    offlineThreadPlaceholder: "Type your message...",
    offlineSuccessTitle: "Message received",
    offlineSuccessText:
      "Thank you. Our customer service team will get back to you by email shortly.",
    email: "Email",
    phone: "Phone (optional)",
    message: "Message",
    submit: "Submit",
    chatOnline: "Online support",
    chatEnded: "Chat ended",
    typePlaceholder: "Type a message...",
    chatEndedHint: "This conversation has ended.",
    startNewChat: "Start a new chat",
  },
  zh: {
    panelTitle: "帮助中心",
    panelStatusOnline: "客服在线",
    panelStatusOffline: "客服离线",
    intro: "请先查看常见问题，如需进一步帮助可转接人工客服。",
    transferBtn: "转人工客服",
    backToFaq: "返回常见问题",
    offlineIntro:
      "当前客服不在，可留下联系方式，后续客服会通过邮箱回复您。",
    offlineBanner: "当前为非营业时间，客服离线，您可以留言，我们会通过邮件回复。",
    offlineThreadPlaceholder: "输入留言…",
    offlineSuccessTitle: "留言已提交",
    offlineSuccessText: "感谢您的留言，客服会通过邮箱尽快回复您。",
    email: "邮箱",
    phone: "电话（选填）",
    message: "留言内容",
    submit: "提交留言",
    chatOnline: "在线客服",
    chatEnded: "会话已结束",
    typePlaceholder: "输入消息…",
    chatEndedHint: "本次会话已结束。",
    startNewChat: "开始新会话",
  },
};

export const FAQ_ITEMS = {
  en: [
    {
      id: "shipping",
      question: "How long does shipping take?",
      answer:
        "Most US orders ship within 3–5 business days after production. International delivery times vary by destination; you will see an estimated timeline at checkout.",
    },
    {
      id: "returns",
      question: "What is your return policy?",
      answer:
        "Unworn items in original condition may be returned within 30 days of delivery. Custom or engraved pieces may have different terms — contact us before ordering if you need details.",
    },
    {
      id: "lab-grown",
      question: "Are your diamonds lab-grown?",
      answer:
        "Yes. BoldRadiant specializes in lab-grown diamonds — ethically sourced, fully certified, and typically offered at better value than comparable mined stones.",
    },
    {
      id: "sizing",
      question: "How do I find my ring size?",
      answer:
        "Use our sizing guide on the product page, or visit a local jeweler for a professional measurement. We recommend sizing your dominant hand's ring finger.",
    },
    {
      id: "payment",
      question: "Which payment methods do you accept?",
      answer:
        "We accept major credit and debit cards via Stripe, as well as PayPal where available. All transactions are secured with industry-standard encryption.",
    },
  ],
  zh: [
    {
      id: "shipping",
      question: "发货需要多久？",
      answer:
        "美国订单通常在制作完成后 3–5 个工作日内发出；国际订单时效因目的地而异，结算页会显示预计送达时间。",
    },
    {
      id: "returns",
      question: "退换货政策是什么？",
      answer:
        "未佩戴且保持原状的商品可在签收后 30 天内申请退货。定制或刻字商品可能有特殊条款，下单前欢迎先联系我们确认。",
    },
    {
      id: "lab-grown",
      question: "你们的钻石是培育钻石吗？",
      answer:
        "是的。BoldRadiant 专注实验室培育钻石，来源可追溯、附带证书，相较同级别天然钻石通常更具性价比。",
    },
    {
      id: "sizing",
      question: "如何确定戒指尺码？",
      answer:
        "可参考商品页的尺码指南，或到当地珠宝店实测。建议测量惯用手对应的无名指围度。",
    },
    {
      id: "payment",
      question: "支持哪些支付方式？",
      answer:
        "支持 Stripe 信用卡/借记卡，部分地区还支持 PayPal。所有支付均通过行业标准加密保护。",
    },
  ],
};

export function getFaqLocale(locale) {
  const code = String(locale || "en").toLowerCase();
  if (code.startsWith("zh")) return "zh";
  return "en";
}

export function getFaqCopy(locale) {
  return FAQ_COPY[getFaqLocale(locale)];
}

export function getFaqItems(locale) {
  return FAQ_ITEMS[getFaqLocale(locale)];
}
