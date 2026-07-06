"use client";

import React from "react";
import { uploadCustomizeFile } from "@/service/customize";

/**
 * 商品定制字段状态中枢（单例 hook）。
 *
 * 在 BaseLayout 只调用一次，返回的 API 经 ProductContext.customize 下发给
 * 所有渲染点（主区 GoodMainRight + footer 弹窗 ComboModal）。这样多处渲染的
 * CustomizationFields 共享同一份填写值，且只有这一处向 customizeRef 注册
 * getData/validate —— 避免多实例各自持有本地 state 导致的「双注册覆盖 / 值不同步」。
 *
 *   - input/textarea → value 字符串；file → 上传到 /chat/upload，value="" + files[]。
 *   - getData() → 组装好的 customize_data 数组（frozen shape），供加购/下单读取。
 *   - validate() → 必填校验，未通过时置内联错误并返回 false。
 *
 * max_length 语义：文本类=最大字数；file=最多文件数；0/缺省 → 套默认上限。
 *
 * FILLED VALUE SHAPE（与后端约定，勿改）：
 *   [{ field_code, field_label, field_type, value, files:[{url,name,type}] }]
 */

// 默认上限：文本 200 字，文件 5 个（后端 max_length=0 时套用）。
export const DEFAULT_TEXT_MAX = 200;
export const DEFAULT_FILE_MAX = 5;

export const textLimitOf = (field) =>
  field.max_length > 0 ? field.max_length : DEFAULT_TEXT_MAX;
export const fileLimitOf = (field) =>
  field.max_length > 0 ? field.max_length : DEFAULT_FILE_MAX;

export default function useCustomizeFields(customizeFields, customizeRef) {
  // 字段配置来自服务端（context），仅取已启用且形状合法的项。
  const fields = React.useMemo(
    () => (Array.isArray(customizeFields) ? customizeFields : []),
    [customizeFields]
  );

  // values: { [field_code]: { value: string, files: [{url,name,type}] } }
  const [values, setValues] = React.useState({});
  // 上传中的字段集合（用于禁用/提示）
  const [uploading, setUploading] = React.useState({});
  // 校验错误：{ [field_code]: true }
  const [errors, setErrors] = React.useState({});
  // 文件相关提示（超限/失败）：{ [field_code]: string }
  const [notice, setNotice] = React.useState({});

  // 字段集变化（切商品 → context 下发新字段）时,在渲染期重置 values/错误/提示。
  // 用 React 官方「props 变更时调整 state」模式:用 state 记上一次签名,
  // 渲染期直接 setState(非 effect、不碰 ref),React 会立即重渲染,无级联开销。
  const fieldsSig = fields.map((f) => f.field_code).join("|");
  const [prevSig, setPrevSig] = React.useState(null);
  if (prevSig !== fieldsSig) {
    setPrevSig(fieldsSig);
    const init = {};
    fields.forEach((f) => {
      init[f.field_code] = { value: "", files: [] };
    });
    setValues(init);
    setErrors({});
    setNotice({});
    setUploading({});
  }

  const setTextValue = React.useCallback((code, value) => {
    setValues((prev) => ({
      ...prev,
      [code]: { value, files: prev[code]?.files || [] }
    }));
    setErrors((prev) => (prev[code] ? { ...prev, [code]: false } : prev));
  }, []);

  const handleFileSelect = React.useCallback(
    async (field, fileList) => {
      const code = field.field_code;
      const limit = fileLimitOf(field);
      const incoming = Array.from(fileList || []);
      if (!incoming.length) return;

      // 已有 + 新增不得超过上限；超出部分截断并提示。
      const existing = values[code]?.files || [];
      const room = Math.max(0, limit - existing.length);
      if (room <= 0) {
        setNotice((prev) => ({ ...prev, [code]: `最多上传 ${limit} 个文件` }));
        return;
      }
      const files = incoming.slice(0, room);
      const truncated = incoming.length > room;

      setUploading((prev) => ({ ...prev, [code]: true }));
      try {
        const uploaded = [];
        for (const file of files) {
          const res = await uploadCustomizeFile(file);
          // 响应拦截器返回的是 body：{ code, message, data:{ url, name, type, size } }
          const data = res?.data || res;
          if (data?.url) {
            uploaded.push({ url: data.url, name: data.name, type: data.type });
          }
        }
        if (uploaded.length) {
          setValues((prev) => ({
            ...prev,
            [code]: {
              value: "",
              files: [...(prev[code]?.files || []), ...uploaded]
            }
          }));
          setErrors((prev) => (prev[code] ? { ...prev, [code]: false } : prev));
        }
        setNotice((prev) => ({
          ...prev,
          [code]: truncated ? `最多上传 ${limit} 个文件，已忽略多余文件` : ""
        }));
      } catch (err) {
        console.error("uploadCustomizeFile 失败:", err?.message);
        setNotice((prev) => ({ ...prev, [code]: "上传失败，请重试" }));
      } finally {
        setUploading((prev) => ({ ...prev, [code]: false }));
      }
    },
    [values]
  );

  const removeFile = React.useCallback((code, index) => {
    setValues((prev) => {
      const cur = prev[code]?.files || [];
      return {
        ...prev,
        [code]: {
          value: prev[code]?.value || "",
          files: cur.filter((_, i) => i !== index)
        }
      };
    });
  }, []);

  // 组装 frozen shape 数组 + 必填校验，注册进 customizeRef 供加购读取。
  React.useEffect(() => {
    if (!customizeRef) return;
    customizeRef.current = {
      getData: () =>
        fields.map((f) => {
          const v = values[f.field_code] || { value: "", files: [] };
          const isFile = f.field_type === "file";
          return {
            field_code: f.field_code,
            field_label: f.field_label,
            field_type: f.field_type,
            value: isFile ? "" : v.value || "",
            files: isFile ? v.files || [] : []
          };
        }),
      validate: () => {
        const nextErrors = {};
        let ok = true;
        fields.forEach((f) => {
          if (!f.required) return;
          const v = values[f.field_code] || { value: "", files: [] };
          const filled =
            f.field_type === "file"
              ? (v.files || []).length > 0
              : (v.value || "").trim().length > 0;
          if (!filled) {
            nextErrors[f.field_code] = true;
            ok = false;
          }
        });
        setErrors(nextErrors);
        return ok;
      }
    };
  }, [fields, values, customizeRef]);

  return {
    fields,
    values,
    uploading,
    errors,
    notice,
    setTextValue,
    handleFileSelect,
    removeFile
  };
}
