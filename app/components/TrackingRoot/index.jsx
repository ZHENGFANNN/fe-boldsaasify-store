"use client";

import { useEffect } from "react";
import { track } from "@/utils/analytics";

/**
 * 全局声明式埋点监听器。挂在 layout body 内即可全站生效。
 *
 * 使用方式（示例）：
 *   <button data-event="AddToCart" data-ev-product-name={name} data-ev-price={price}>
 *   <a data-event="ProductNav" data-ev-href="#combo">套餐</a>
 *   <div data-event="Certificate" data-ev-lab="GIA">证书</div>
 *
 * 复杂 payload 走 JSON：
 *   <div data-event="Purchase" data-ev-props={JSON.stringify({ currency, value, contents })}>
 *
 * 语义：
 *   1. 冒泡到 document 后用 closest('[data-event]') 匹配最近的埋点祖先
 *   2. 从 data-ev-* 属性收集参数：dataset.evProductName → params.productName
 *   3. 若同时提供 data-ev-props 且是合法 JSON，其字段与前述字段合并（props 优先级低）
 *   4. 触发 track(eventName, params)，由 utils/analytics.js 分发到 GA4/FB Pixel/dataLayer
 */
export default function TrackingRoot() {
  useEffect(() => {
    const handler = (e) => {
      const el = e.target?.closest?.("[data-event]");
      if (!el) return;
      const eventName = el.dataset.event;
      if (!eventName) return;

      const params = {};

      // ① 先解析 data-ev-props JSON（如存在），作为底层参数
      if (el.dataset.evProps) {
        try {
          const parsed = JSON.parse(el.dataset.evProps);
          if (parsed && typeof parsed === "object") Object.assign(params, parsed);
        } catch {
          // JSON 非法直接忽略，不阻断
        }
      }

      // ② 遍历 dataset 收集 data-ev-* → camelCase（dataset 自动 camelCase 化，前缀 ev）
      // 注意跳过 'evProps'（已在上面处理），保留 dataset.evXxx（去掉 ev 前缀首字母小写）
      for (const key of Object.keys(el.dataset)) {
        if (!key.startsWith("ev") || key === "evProps" || key === "event") continue;
        // dataset key 已经是 camelCase 形式：evProductName → 去掉 'ev' → 'ProductName' → 'productName'
        const stripped = key.slice(2);
        if (!stripped) continue;
        const paramKey = stripped[0].toLowerCase() + stripped.slice(1);
        params[paramKey] = el.dataset[key];
      }

      track(eventName, params);
    };

    document.addEventListener("click", handler, { capture: false, passive: true });
    return () => document.removeEventListener("click", handler);
  }, []);

  return null;
}
