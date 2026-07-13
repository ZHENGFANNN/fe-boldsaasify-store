"use client";

import React from "react";
import styles from "./index.module.scss";
import { mediaKindOf } from "@/utils/customizeFile";
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
 * 可复用「上传」组件（纯展示 + 回调）。
 *
 * 只负责「选择框 + 已上传列表 + 计数」的渲染与事件回调；真正的上传 / 校验 /
 * 错误处理留在父级——父级在 onPick 里拿到用户选中的 FileList 后自行上传，把结果
 * 回填到 files。缩略图沿用 mediaKindOf：image 显示缩略图，video/file 显示类型
 * 图标；点击查看复用 CustomizeFileLink（图片/视频 portal 预览，其它新窗口打开）。
 *
 * props：
 *   - files          已上传文件数组，元素形如 { url, name, type|kind, previewUrl?, uploading?, localId? }
 *   - max            数量上限（计数分母，达到即禁用选择框）
 *   - accept         透传 <input accept>（如 "image/*" / "image/*,video/*"）
 *   - multiple       是否允许多选（默认 true）
 *   - uploading      全局上传中：禁用选择框并显示 uploadingText（单文件场景用）
 *   - disabled       禁用选择框
 *   - invalid        选择框错误态描边
 *   - onPick(fileList)      用户选了文件（父级去真正上传）
 *   - onRemove(index, file) 删除某一项
 *   - LANG           文案对象（用于默认按钮文案兜底）
 *   - label / hint   选择框上方的标题 / 副说明（可选）
 *   - pickerText     选择框内文案（默认 Upload file）
 *   - uploadingText  uploading 时选择框内文案（默认 Uploading...）
 *   - error          列表下方错误 / 提示文案（可选）
 */
export default function MediaUploader({
  files = [],
  max = 5,
  accept,
  multiple = true,
  uploading = false,
  disabled = false,
  invalid = false,
  onPick,
  onRemove,
  LANG,
  label,
  hint,
  pickerText,
  uploadingText,
  error,
}) {
  const full = files.length >= max;
  const pickerDisabled = disabled || uploading || full;
  const uploadLabel =
    pickerText || LANG?.["common.media.upload"] || "Upload file";
  const uploadingLabel =
    uploadingText || LANG?.["common.media.uploading"] || "Uploading...";

  return (
    <div className={styles.uploader} data-role="media-uploader">
      {label || hint ? (
        <div className={styles.head}>
          {label ? <span className={styles.label}>{label}</span> : null}
          {hint ? <span className={styles.hint}>{hint}</span> : null}
        </div>
      ) : null}

      <label
        className={`${styles.file_picker} ${invalid ? styles.invalid : ""} ${
          pickerDisabled ? styles.file_picker_disabled : ""
        }`}
      >
        <input
          type="file"
          className={styles.file_input}
          accept={accept}
          multiple={multiple}
          disabled={pickerDisabled}
          onChange={(e) => {
            if (e.target.files && e.target.files.length) {
              onPick?.(e.target.files);
            }
            e.target.value = "";
          }}
        />
        <span>{uploading ? uploadingLabel : uploadLabel}</span>
      </label>

      {files.length ? (
        <ul className={styles.file_list}>
          {files.map((f, i) => {
            const kind = mediaKindOf(f);
            const previewSrc = f.url || f.previewUrl || "";
            const uploadingItem = !!f.uploading;
            const failedItem = !!f.failed;
            const linkFile = { url: previewSrc, name: f.name, type: f.type };
            const failedText = LANG?.["common.media.failed"] || "Upload failed";
            const uploadingItemText =
              LANG?.["common.media.uploading"] || "Uploading...";
            const thumbInner = (
              <>
                <span className={styles.file_thumb}>
                  {kind === "image" && previewSrc ? (
                    <img
                      className={styles.file_thumb_img}
                      src={previewSrc}
                      alt={f.name}
                    />
                  ) : (
                    <span className={styles.file_thumb_icon}>
                      <FileTypeIcon kind={kind} />
                    </span>
                  )}
                </span>
                <span className={styles.file_meta}>
                  <span className={styles.file_name}>{f.name}</span>
                  <span
                    className={`${styles.file_ext} ${
                      failedItem ? styles.file_ext_failed : ""
                    }`}
                  >
                    {failedItem
                      ? failedText
                      : uploadingItem
                        ? uploadingItemText
                        : fileMetaLabel(f)}
                  </span>
                </span>
              </>
            );
            // 上传中 / 失败 / 无地址：不可点击预览（用静态容器）；仅成功项走 CustomizeFileLink。
            const clickable = !uploadingItem && !failedItem && !!f.url;
            return (
              <li
                key={`${f.localId || f.url || f.name}-${i}`}
                className={`${styles.file_item} ${
                  failedItem ? styles.file_item_failed : ""
                }`}
              >
                {clickable ? (
                  <CustomizeFileLink className={styles.file_link} file={linkFile}>
                    {thumbInner}
                  </CustomizeFileLink>
                ) : (
                  <div className={styles.file_link_static}>{thumbInner}</div>
                )}
                {/* 卡片右侧状态：上传中转圈 / 失败红标 */}
                <div className={styles.file_status}>
                  {uploadingItem ? (
                    <span className={styles.status_spinner} />
                  ) : failedItem ? (
                    <span className={styles.status_failed} title={failedText}>
                      !
                    </span>
                  ) : null}
                </div>
                <button
                  type="button"
                  className={styles.file_remove}
                  aria-label="remove"
                  onClick={() => onRemove?.(i, f)}
                >
                  ×
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}

      <div className={styles.counter}>
        {files.length}/{max}
      </div>

      {error ? <div className={styles.error_text}>{error}</div> : null}
    </div>
  );
}
