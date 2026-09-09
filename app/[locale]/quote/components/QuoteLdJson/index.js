/** @format */

// /quote 页的 JSON-LD（server component，纯静态 —— 爬虫不执行 JS）。
//
// 🔴 这里刻意用**原生 `<script>`** 而不是 `next/script`。
// `next/script` 默认 strategy=afterInteractive，是「水合后由 JS 注入」——
// 结构化数据不会进构建产物的 HTML，只以转义字符串躺在 RSC payload 里。
// 实测本站 5 个 ld-json 组件（本页 + product/category/index/blog 四个既有的）
// 在 .next/server/app/**.html 里 `<script type="application/ld+json"` 命中数全是 0。
// 不执行 JS 的爬虫（Bing / 社交卡片 / 各家 LLM 抓取）等于完全看不到。
// server component 里直接写原生 script 才会被 SSG 烤进 HTML —— 这也是 App Router
// 官方文档对 JSON-LD 的推荐写法。改回 next/script 会静默失去结构化数据。
//
// 刻意**不**输出 Product/Offer：本页不卖任何 SKU，中心石数字是行情估价而非可购价格。
// 拿估价冒充 Offer.price 会让 Google 抓到一个下不了单的价格，属结构化数据误报，
// 有被判 rich-result spam 的风险。这里只声明这是个「工具 + FAQ」：
//   - WebApplication：说明这是个计价工具（Google 对计算器类页面的常规标注）
//   - FAQPage：把页面上真实存在的问答暴露成 rich result（问答文案与页面可见文案一致，
//     否则同样违反结构化数据规范 —— 不可见内容不得进 FAQ schema）
//
// ⚠️ 下面 FAQ 的 3 条问答必须与 QuoteEstimator 里实际渲染的解释文案保持同义；
// 改动页面文案时同步改这里，别让 schema 和可见内容漂移。
export default function QuoteLdJson({ locale, LANG = {}, companyName }) {
  const brand = companyName || "";

  const faqs = [
    {
      q: LANG["quote.faq_q1"] || "Does the setting price include the centre diamond?",
      a:
        LANG["quote.faq_a1"] ||
        "No. Our settings are sold on their own so you can choose your centre diamond separately. The carat weight listed on a setting is the total weight of its accent diamonds, not the centre stone.",
    },
    {
      q: LANG["quote.faq_q2"] || "Why does a round diamond cost more than a fancy shape?",
      a:
        LANG["quote.faq_a2"] ||
        "A round brilliant loses more of the rough stone during cutting than shapes like oval, emerald or princess. At the same carat weight and grades, a fancy shape is typically less expensive, which is why it gives you more visible size for the same budget.",
    },
    {
      q: LANG["quote.faq_q3"] || "Is this estimate a final quote?",
      a:
        LANG["quote.faq_a3"] ||
        "No. Centre diamond figures are market estimates for lab-grown stones and will vary with the individual stone and its grading report. Setting prices shown are our real current prices. Contact a specialist for a firm quote on a specific stone.",
    },
  ];

  const ldJson = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebApplication",
        name:
          LANG["quote.heading"] ||
          (brand
            ? `${brand} Ring Price Estimator`
            : "Lab-Grown Diamond & Ring Price Estimator"),
        applicationCategory: "BusinessApplication",
        operatingSystem: "Any",
        inLanguage: locale || "en",
        description:
          LANG["quote.description"] ||
          "Estimate the cost of a lab-grown centre diamond by shape, carat, colour, clarity and cut, then add a real setting price for a complete ring budget.",
        // 工具本身免费使用（不是商品价格，故用 Offer price 0 表达「免费工具」）。
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "USD",
        },
        ...(brand
          ? { publisher: { "@type": "Organization", name: brand } }
          : {}),
      },
      {
        "@type": "FAQPage",
        mainEntity: faqs.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
      },
    ],
  };

  return (
    <script
      id="store-quote-ld-json"
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        // FAQ 文案与品牌名来自后端库（ERP 可编辑），值里一旦出现 `</script>`
        // 就会截断本标签、后续内容被当 HTML 解析。把所有左尖括号改写成它的
        // JSON unicode 转义形式（解析后仍是同一个字符，语义不变）即封死这条路径。
        __html: JSON.stringify(ldJson, null, "\t").replace(/</g, "\\u003c"),
      }}
    />
  );
}
