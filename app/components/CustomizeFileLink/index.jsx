"use client";

import React from "react";
import ReactDOM from "react-dom";
import styles from "./index.module.scss";
import { mediaKindOf } from "@/utils/customizeFile";

/**
 * 定制字段已上传文件的可点击项。
 *   - 图片/视频：点击弹窗内联预览（portal 全屏遮罩），不打开链接。
 *   - 其他类型（zip/文档等）：保持原样，新窗口打开链接。
 * 自包含预览态，可在商品详情/购物车/订单等多处直接替换原 <a> 使用。
 *
 * props：file={url,name,type}；className 作用于可点击文本；children 覆盖展示文案（默认 file.name）。
 */
export default function CustomizeFileLink({ file, className, children }) {
  const [open, setOpen] = React.useState(false);
  const kind = mediaKindOf(file);
  const label = children ?? file?.name;

  // 弹窗打开时锁 body 滚动。
  React.useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // 其他类型：普通外链，行为不变。
  if (kind === "other") {
    return (
      <a
        className={className}
        href={file?.url}
        target="_blank"
        rel="noopener noreferrer"
        title={file?.name}
      >
        {label}
      </a>
    );
  }

  const close = () => setOpen(false);

  return (
    <>
      <a
        className={className}
        href={file?.url}
        title={file?.name}
        onClick={(e) => {
          e.preventDefault();
          setOpen(true);
        }}
      >
        {label}
      </a>
      {open && typeof document !== "undefined"
        ? ReactDOM.createPortal(
            <div className={styles.overlay} onClick={close}>
              <button
                type="button"
                className={styles.close}
                onClick={close}
                aria-label="close"
              >
                ×
              </button>
              <div className={styles.content} onClick={(e) => e.stopPropagation()}>
                {kind === "image" ? (
                  <img className={styles.media} src={file?.url} alt={file?.name} />
                ) : (
                  <video
                    className={styles.media}
                    src={file?.url}
                    controls
                    autoPlay
                    playsInline
                  />
                )}
              </div>
            </div>,
            document.body
          )
        : null}
    </>
  );
}
