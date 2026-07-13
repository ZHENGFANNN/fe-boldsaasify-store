"use client";

import React from "react";
import styles from "./index.module.scss";
import ProductContext from "../../../ProductContext";
import { textLimitOf, fileLimitOf } from "./useCustomizeFields";
import { acceptForFileType } from "@/utils/customizeFile";
import MediaUploader from "@/components/MediaUploader";

/**
 * 商品定制字段（纯展示）。
 *   - 状态与逻辑集中在 useCustomizeFields（BaseLayout 单例调用），
 *     经 ProductContext.customize 下发。本组件只渲染、只回调，无本地 state。
 *   - 因此可在主区（GoodMainRight）与 footer 弹窗（ComboModal）同时渲染：
 *     两处共享同一份填写值，且只注册一次 getData/validate（见 useCustomizeFields）。
 */
export default function CustomizationFields() {
  const { customize, LANG } = React.useContext(ProductContext);
  const {
    fields = [],
    values = {},
    uploading = {},
    errors = {},
    notice = {},
    setTextValue,
    handleFileSelect,
    removeFile
  } = customize || {};

  if (!fields.length) return null;

  return (
    <div className={styles.container} data-role="customization-fields">
      {fields.map((field) => {
        const v = values[field.field_code] || { value: "", files: [] };
        const hasError = errors[field.field_code];
        const isUploading = uploading[field.field_code];
        const textMax = textLimitOf(field);
        const fileMax = fileLimitOf(field);
        const fileFull = (v.files || []).length >= fileMax;
        const fileNote = notice[field.field_code];
        return (
          <div className={styles.field} key={field.field_code}>
            <label className={styles.label}>
              {field.field_label}
              {field.required ? (
                <span className={styles.required}>*</span>
              ) : null}
            </label>

            {field.field_type === "input" ? (
              <>
                <input
                  type="text"
                  className={`${styles.input} ${hasError ? styles.input_error : ""}`}
                  placeholder={field.placeholder || ""}
                  value={v.value}
                  maxLength={textMax}
                  onChange={(e) =>
                    setTextValue(field.field_code, e.target.value.slice(0, textMax))
                  }
                />
                <div className={styles.counter}>
                  {(v.value || "").length}/{textMax}
                </div>
              </>
            ) : null}

            {field.field_type === "textarea" ? (
              <>
                <textarea
                  className={`${styles.textarea} ${hasError ? styles.input_error : ""}`}
                  placeholder={field.placeholder || ""}
                  value={v.value}
                  maxLength={textMax}
                  onChange={(e) =>
                    setTextValue(field.field_code, e.target.value.slice(0, textMax))
                  }
                />
                <div className={styles.counter}>
                  {(v.value || "").length}/{textMax}
                </div>
              </>
            ) : null}

            {field.field_type === "file" ? (
              <MediaUploader
                files={v.files || []}
                max={fileMax}
                accept={acceptForFileType(field.file_type)}
                uploading={isUploading}
                invalid={hasError}
                onPick={(fileList) => handleFileSelect(field, fileList)}
                onRemove={(i) => removeFile(field.field_code, i)}
                LANG={LANG}
                pickerText={
                  field.placeholder ||
                  LANG?.["store.product.customize_upload"] ||
                  "Upload file"
                }
                uploadingText={
                  LANG?.["store.product.customize_uploading"] || "Uploading..."
                }
                error={fileNote}
              />
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
