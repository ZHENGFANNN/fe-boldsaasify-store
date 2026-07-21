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

// 过滤出有 url 的有效项（图/视频混合）。
function normalize(list) {
  return Array.isArray(list) ? list.filter((m) => m && m.url) : [];
}

/**
 * PreviewMediaViewer —— 受控的全屏媒体预览器（图片/视频混合列表）。
 * 传入完整 list 与起始 index 即展示当前项，支持左右切换：箭头 / 键盘 ← → /
 * 移动端左右滑动 / 底部缩略图跳转，Esc 关闭。切走时当前项 remount 自动停播视频。
 * portal 到 body，遮罩 z 9999999999 压过 sticky 导航（99999999），避免被穿透。
 *
 * @param {{url:string,type?:string,name?:string}[]} list 媒体列表
 * @param {number} index 起始下标
 * @param {boolean} open 是否展示
 * @param {() => void} onClose 关闭回调
 */
export function PreviewMediaViewer({
  list = [],
  index = 0,
  open = false,
  onClose = () => {},
}) {
  const items = React.useMemo(() => normalize(list), [list]);
  const total = items.length;
  const clamp = (i) => Math.min(Math.max(i, 0), Math.max(total - 1, 0));

  const [current, setCurrent] = React.useState(() => clamp(index));
  const touchX = React.useRef(null);

  // 每次「打开 / 换起始项」时把 current 对齐到 index：用渲染期比对上一次 (open,index)
  // 的写法（React 官方「随 props 调整 state」范式），避免在 effect 里 setState 触发级联渲染。
  const [startKey, setStartKey] = React.useState(`${open}:${index}`);
  const nextKey = `${open}:${index}`;
  if (nextKey !== startKey) {
    setStartKey(nextKey);
    if (open) setCurrent(clamp(index));
  }

  // 循环切换：首项再往前到末项，末项再往后回首项。
  const go = React.useCallback(
    (dir) => {
      setCurrent((c) => (total ? (c + dir + total) % total : 0));
    },
    [total]
  );

  // 键盘：Esc 关闭，← → 切换。
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowLeft") go(-1);
      else if (e.key === "ArrowRight") go(1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, go, onClose]);

  // 锁背景滚动。
  React.useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open || total === 0) return null;

  const active = items[current] || items[0];
  const activeIsVideo = isVideo(active);
  const multi = total > 1;

  const onTouchStart = (e) => {
    touchX.current = e.touches?.[0]?.clientX ?? null;
  };
  const onTouchEnd = (e) => {
    if (touchX.current == null) return;
    const endX = e.changedTouches?.[0]?.clientX ?? touchX.current;
    const dx = endX - touchX.current;
    if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1); // 左滑看下一张，右滑看上一张
    touchX.current = null;
  };

  return ReactDOM.createPortal(
    <div
      className={styles.viewer}
      onClick={onClose}
      data-role="preview-media-viewer"
    >
      <div
        className={styles.close}
        role="button"
        aria-label="Close"
        onClick={onClose}
      >
        ×
      </div>

      {multi ? (
        <div className={styles.counter} onClick={(e) => e.stopPropagation()}>
          {current + 1} / {total}
        </div>
      ) : null}

      {multi ? (
        <div
          className={[styles.arrow, styles.arrow_prev].join(" ")}
          role="button"
          aria-label="Previous"
          onClick={(e) => {
            e.stopPropagation();
            go(-1);
          }}
        >
          <span className={styles.arrow_icon} />
        </div>
      ) : null}

      <div
        className={styles.stage}
        onClick={(e) => e.stopPropagation()}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {activeIsVideo ? (
          <video
            key={active.url}
            className={styles.stage_video}
            src={active.url}
            controls
            autoPlay
            playsInline
            controlsList="nodownload"
          />
        ) : (
          <img
            key={active.url}
            className={styles.stage_img}
            src={active.url}
            alt={active.name || ""}
          />
        )}
      </div>

      {multi ? (
        <div
          className={[styles.arrow, styles.arrow_next].join(" ")}
          role="button"
          aria-label="Next"
          onClick={(e) => {
            e.stopPropagation();
            go(1);
          }}
        >
          <span className={styles.arrow_icon} />
        </div>
      ) : null}

      {multi ? (
        <div className={styles.strip} onClick={(e) => e.stopPropagation()}>
          {items.map((m, i) => {
            const v = isVideo(m);
            const cls = [
              styles.strip_item,
              i === current ? styles.strip_item_active : "",
            ]
              .filter(Boolean)
              .join(" ");
            return (
              <div
                key={`${m.url}-${i}`}
                className={cls}
                onClick={() => setCurrent(i)}
              >
                {v ? (
                  <>
                    <video
                      className={styles.strip_media}
                      src={`${m.url}#t=0.1`}
                      muted
                      playsInline
                      preload="metadata"
                    />
                    <span className={styles.strip_play} />
                  </>
                ) : (
                  <img
                    className={styles.strip_media}
                    src={m.url}
                    alt={m.name || ""}
                  />
                )}
              </div>
            );
          })}
        </div>
      ) : null}
    </div>,
    document.body
  );
}

/**
 * PreviewMediaList —— 媒体列表缩略图 + 内置全屏预览器。
 * 渲染一行图/视频缩略图；点击任意项即以该项为起点打开 PreviewMediaViewer，
 * 携带完整列表与当前 index，支持左右切换。可直接下沉到任何「媒体列表 + 点击预览」场景。
 *
 * @param {{url:string,type?:string,name?:string}[]} list 媒体列表（图/视频混合）
 * @param {number} thumbSize 缩略图边长 px，默认 88
 * @param {string} className 追加到缩略图容器的类名（如外层需要 margin）
 */
export default function PreviewMediaList({
  list = [],
  thumbSize = 88,
  className = "",
}) {
  const items = React.useMemo(() => normalize(list), [list]);
  const [open, setOpen] = React.useState(false);
  const [index, setIndex] = React.useState(0);

  if (items.length === 0) return null;

  const openAt = (i) => {
    setIndex(i);
    setOpen(true);
  };

  return (
    <>
      <div
        className={[styles.list, className].filter(Boolean).join(" ")}
        data-role="preview-media-list"
      >
        {items.map((m, i) => {
          const v = isVideo(m);
          return (
            <div
              key={`${m.url}-${i}`}
              className={styles.thumb}
              style={{ width: thumbSize, height: thumbSize }}
              onClick={() => openAt(i)}
              data-role="preview-media-thumb"
            >
              {v ? (
                <>
                  <video
                    className={styles.thumb_media}
                    src={`${m.url}#t=0.1`}
                    muted
                    playsInline
                    preload="metadata"
                  />
                  <div className={styles.thumb_play}>
                    <span className={styles.thumb_play_icon} />
                  </div>
                </>
              ) : (
                <ImageWithSkeleton src={m.url} alt={m.name || ""} />
              )}
            </div>
          );
        })}
      </div>

      <PreviewMediaViewer
        list={items}
        index={index}
        open={open}
        onClose={() => setOpen(false)}
      />
    </>
  );
}
