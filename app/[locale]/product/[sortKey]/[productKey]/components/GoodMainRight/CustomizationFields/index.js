"use client";

import React from "react";
import styles from "./index.module.scss";
import ProductContext from "../../../ProductContext";
import { textLimitOf, fileLimitOf } from "./useCustomizeFields";
import { acceptForFileType, mediaKindOf } from "@/utils/customizeFile";
import CustomizeFileLink from "@/components/CustomizeFileLink";

// 已上传文件的扩展名标签（语言无关的 meta，如 PNG / MP4 / PDF）。取不到扩展名时回退媒体类别。
function fileMetaLabel(f) {
  const src = String(f?.name || f?.url || "");
  const clean = src.split("?")[0].split("#")[0];
  const i = clean.lastIndexOf(".");
  const ext = i >= 0 ? clean.slice(i + 1).toUpperCase() : "";
  if (ext) return ext;
  const kind = mediaKindOf(f);
  return kind === "image" ? "IMAGE" : kind === "video" ? "VIDEO" : "FILE";
}

// 非图片文件的类型图标（视频 / 通用文件），内联 SVG，随文本色。
function FileTypeIcon({ kind }) {
  if (kind === "video") {
    return (
      <svg
        viewBox="0 0 24 24"
        width="20"
        height="20"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <rect x="2.5" y="5" width="19" height="14" rx="2" />
        <path d="M10 9l5 3-5 3V9z" />
      </svg>
    );
  }
  return (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M14 3v5h5" />
      <path d="M6 2h8l5 5v13a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1z" />
    </svg>
  );
}

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
              <div className={styles.file_block}>
                <label
                  className={`${styles.file_picker} ${hasError ? styles.input_error : ""} ${
                    isUploading || fileFull ? styles.file_picker_disabled : ""
                  }`}
                >
                  <input
                    type="file"
                    accept={acceptForFileType(field.file_type)}
                    multiple
                    className={styles.file_input}
                    disabled={isUploading || fileFull}
                    onChange={(e) => {
                      handleFileSelect(field, e.target.files);
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
                <div className={styles.counter}>
                  {(v.files || []).length}/{fileMax}
                </div>
                {fileNote ? (
                  <div className={styles.error_text}>{fileNote}</div>
                ) : null}
                {v.files.length ? (
                  <ul className={styles.file_list}>
                    {v.files.map((f, i) => {
                      const kind = mediaKindOf(f);
                      return (
                        <li key={`${f.url}-${i}`} className={styles.file_item}>
                          <CustomizeFileLink
                            className={styles.file_link}
                            file={f}
                          >
                            <span className={styles.file_thumb}>
                              {kind === "image" ? (
                                <img
                                  className={styles.file_thumb_img}
                                  src={f.url}
                                  alt={f.name}
                                />
                              ) : (
                                <span className={styles.file_thumb_icon}>
                                  <FileTypeIcon kind={kind} />
                                </span>
                              )}
                            </span>
                            <span className={styles.file_meta}>
                              <span className={styles.file_name}>
                                {f.name}
                              </span>
                              <span className={styles.file_ext}>
                                {fileMetaLabel(f)}
                              </span>
                            </span>
                          </CustomizeFileLink>
                          <button
                            type="button"
                            className={styles.file_remove}
                            aria-label="remove"
                            onClick={() => removeFile(field.field_code, i)}
                          >
                            ×
                          </button>
                        </li>
                      );
                    })}
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
