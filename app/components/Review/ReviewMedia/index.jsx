"use client";

import React from "react";
import ReactDOM from "react-dom";
import ImageWithSkeleton from "@/components/ImageWithSkeleton";
import styles from "./index.module.scss";

// 按 media.type 判定图/视频；type 兼容 "video" / "image" 或 mime，兜底看 url 后缀。
function isVideo(media) {
  const t = String(media?.type || "").toLowerCase();
  if (t.includes("video")) return true;
  if (t.includes("image")) return false;
  const url = String(media?.url || "").toLowerCase();
  return /\.(mp4|webm|ogg|mov|m4v)(\?|#|$)/.test(url);
}

/**
 * ReviewMedia —— 单个评论媒体缩略图 + 点击放大/播放的弹窗。
 * 弹窗 portal 到 body，遮罩 z-index 9999999999（压过导航 99999999），与站内
 * ImageModal/VideoModal 层级一致，避免被 sticky 导航穿透。
 *
 * @param {{url:string,type:string,name?:string}} media
 * @param {number} size 缩略图边长 px，默认 88
 */
export default function ReviewMedia({ media, size = 88 }) {
  const [open, setOpen] = React.useState(false);
  const video = isVideo(media);
  const url = media?.url || "";
  const name = media?.name || "";

  React.useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!url) return null;

  return (
    <>
      <div
        className={styles.thumb}
        style={{ width: size, height: size }}
        onClick={() => setOpen(true)}
        data-role="review-media"
      >
        {video ? (
          <>
            <video
              className={styles.thumb_video}
              src={`${url}#t=0.1`}
              muted
              playsInline
              preload="metadata"
            />
            <div className={styles.play}>
              <span className={styles.play_icon} />
            </div>
          </>
        ) : (
          <ImageWithSkeleton
            src={url}
            alt={name}
            className={styles.thumb_img}
          />
        )}
      </div>

      {open &&
        ReactDOM.createPortal(
          <div className={styles.lightbox} onClick={() => setOpen(false)}>
            <div
              className={styles.lightbox_inner}
              onClick={(e) => e.stopPropagation()}
            >
              <div className={styles.close} onClick={() => setOpen(false)}>
                ×
              </div>
              {video ? (
                <video
                  className={styles.lightbox_video}
                  src={url}
                  controls
                  autoPlay
                  playsInline
                  controlsList="nodownload"
                />
              ) : (
                <img className={styles.lightbox_img} src={url} alt={name} />
              )}
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
