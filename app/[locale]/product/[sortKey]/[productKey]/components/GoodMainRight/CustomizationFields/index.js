"use client";

import React from "react";
import styles from "./index.module.scss";
import ProductContext from "../../../ProductContext";
import {
  getCustomizeFields,
  uploadCustomizeFile
} from "@/service/customize";

/**
 * 商品定制字段（客户端）。
 *   - 挂载时按 productInfo.key / sort_key + locale 拉「已启用」字段（按 weight 排序）。
 *   - input/textarea → value 字符串；file → 上传到 /chat/upload，value="" + files[]。
 *   - 把 { getData, validate } 注册进 ProductContext.customizeRef，
 *     加购（GoodBtnList）点击时同步读取并校验必填。
 *
 * FILLED VALUE SHAPE（与后端约定，勿改）：
 *   [{ field_code, field_label, field_type, value, files:[{url,name,type}] }]
 */
export default function CustomizationFields() {
  const { locale, sortKey, productKey, customizeRef, LANG } =
    React.useContext(ProductContext);

  const [fields, setFields] = React.useState([]);
  // values: { [field_code]: { value: string, files: [{url,name,type}] } }
  const [values, setValues] = React.useState({});
  // 上传中的字段集合（用于禁用/提示）
  const [uploading, setUploading] = React.useState({});
  // 校验错误：{ [field_code]: true }
  const [errors, setErrors] = React.useState({});

  // 拉取定制字段。locale 直接作为 language（与 getProductOptions 一致）。
  React.useEffect(() => {
    if (!sortKey || !productKey) return;
    let cancelled = false;
    getCustomizeFields({
      good_key: productKey,
      good_sort_key: sortKey,
      language: locale
    })
      .then((res) => {
        if (cancelled) return;
        const list = res?.code === 0 && Array.isArray(res.data) ? res.data : [];
        setFields(list);
        // 初始化 values
        const init = {};
        list.forEach((f) => {
          init[f.field_code] = { value: "", files: [] };
        });
        setValues(init);
      })
      .catch(() => {
        if (!cancelled) setFields([]);
      });
    return () => {
      cancelled = true;
    };
  }, [sortKey, productKey, locale]);

  const setTextValue = React.useCallback((code, value) => {
    setValues((prev) => ({
      ...prev,
      [code]: { value, files: prev[code]?.files || [] }
    }));
    setErrors((prev) => (prev[code] ? { ...prev, [code]: false } : prev));
  }, []);

  const handleFileSelect = React.useCallback(async (code, fileList) => {
    const files = Array.from(fileList || []);
    if (!files.length) return;
    setUploading((prev) => ({ ...prev, [code]: true }));
    try {
      const uploaded = [];
      for (const file of files) {
        const res = await uploadCustomizeFile(file);
        if (res?.url) {
          uploaded.push({ url: res.url, name: res.name, type: res.type });
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
    } catch (err) {
      console.error("uploadCustomizeFile 失败:", err?.message);
    } finally {
      setUploading((prev) => ({ ...prev, [code]: false }));
    }
  }, []);

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

  if (!fields.length) return null;

  return (
    <div className={styles.container} data-role="customization-fields">
      {fields.map((field) => {
        const v = values[field.field_code] || { value: "", files: [] };
        const hasError = errors[field.field_code];
        const isUploading = uploading[field.field_code];
        return (
          <div className={styles.field} key={field.field_code}>
            <label className={styles.label}>
              {field.field_label}
              {field.required ? (
                <span className={styles.required}>*</span>
              ) : null}
            </label>

            {field.field_type === "input" ? (
              <input
                type="text"
                className={`${styles.input} ${hasError ? styles.input_error : ""}`}
                placeholder={field.placeholder || ""}
                value={v.value}
                onChange={(e) =>
                  setTextValue(field.field_code, e.target.value)
                }
              />
            ) : null}

            {field.field_type === "textarea" ? (
              <textarea
                className={`${styles.textarea} ${hasError ? styles.input_error : ""}`}
                placeholder={field.placeholder || ""}
                value={v.value}
                maxLength={1000}
                onChange={(e) =>
                  setTextValue(field.field_code, e.target.value)
                }
              />
            ) : null}

            {field.field_type === "file" ? (
              <div className={styles.file_block}>
                <label
                  className={`${styles.file_picker} ${hasError ? styles.input_error : ""}`}
                >
                  <input
                    type="file"
                    accept="image/*,video/*"
                    multiple
                    className={styles.file_input}
                    disabled={isUploading}
                    onChange={(e) => {
                      handleFileSelect(field.field_code, e.target.files);
                      e.target.value = "";
                    }}
                  />
                  <span>
                    {isUploading
                      ? LANG?.["store.product.customize_uploading"] ||
                        "Uploading..."
                      : field.placeholder ||
                        LANG?.["store.product.customize_upload"] ||
                        "Upload file"}
                  </span>
                </label>
                {v.files.length ? (
                  <ul className={styles.file_list}>
                    {v.files.map((f, i) => (
                      <li key={`${f.url}-${i}`} className={styles.file_item}>
                        <span className={styles.file_name}>{f.name}</span>
                        <button
                          type="button"
                          className={styles.file_remove}
                          aria-label="remove"
                          onClick={() => removeFile(field.field_code, i)}
                        >
                          ×
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ) : null}

            {hasError ? (
              <div className={styles.error_text}>
                {LANG?.["store.product.customize_required"] ||
                  "This field is required"}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
