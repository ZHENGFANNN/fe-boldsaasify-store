"use client";

import ResultState from "@/components/ResultState";

/**
 * Contact 表单提交成功后的展示态，取代原本不明显的 success toast。
 * 复用于页内 ContactForm 与全局 ContactModal，文案走 LANG + 英文兜底。
 *
 * 本组件为 ResultState 的薄壳包装，保留原有 { LANG, onReset } props 契约，
 * 视觉/交互统一到公共 ResultState（SuccessIcon 绿底方块勾 + 单主按钮）。
 */
export default function ContactSuccess({ LANG, onReset }) {
  return (
    <ResultState
      status="success"
      title={LANG?.["common.contact.success_title"] || "Thank you"}
      description={
        LANG?.["common.contact.success_desc"] ||
        "We've received your message and will get back to you as soon as possible."
      }
      actions={[
        {
          label:
            LANG?.["common.contact.send_another"] || "Send another message",
          onClick: onReset,
          variant: "primary"
        }
      ]}
    />
  );
}
