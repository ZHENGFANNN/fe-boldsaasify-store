"use client";

import React from "react";
import FormTextarea from "@/components/Form/FormTextArea";
import styles from "./index.module.scss";

// 粘贴地址 → AI 解析 → 自动填充。
// 用户把一整段地址（姓名/电话/街道/城市/邮编）粘进来，点按钮调后端 parseAddress，
// 解析出的结构化字段由父组件回填到表单。
//
// props:
//  - apiParse：各表单 Api.parseAddress
//  - language：locale
//  - onParsed(parsed)：解析成功回调（父组件用 fillField 回填）
//  - onError()：解析失败回调（父组件弹提示）
//  - LANG：文案
export default function PasteAddressBox({
  apiParse,
  language = "en",
  onParsed,
  onError,
  LANG = {},
}) {
  const [text, setText] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  const handleParse = async () => {
    if (loading || !text.trim()) return;
    setLoading(true);
    try {
      const res = await apiParse({ text, language });
      if (res?.code === 0 && res.data) {
        onParsed?.(res.data);
        setText("");
      } else {
        throw new Error("PARSE_FAIL");
      }
    } catch (e) {
      onError?.();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.wrap}>
      <FormTextarea
        label={
          LANG["user_account.shipping_address.paste_placeholder"] ||
          "Paste a full address, AI fills the form"
        }
        required={false}
        inputProps={{
          value: text,
          onChange: (e) => setText(e.target.value),
          onBlur: () => {},
        }}
      />
      <button
        type="button"
        className={styles.btn}
        disabled={loading || !text.trim()}
        onClick={handleParse}
      >
        {loading
          ? LANG["user_account.shipping_address.parsing"] || "Parsing…"
          : `✨ ${
              LANG["user_account.shipping_address.smart_fill"] || "Smart fill"
            }`}
      </button>
    </div>
  );
}
