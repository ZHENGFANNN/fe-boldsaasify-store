"use client";

import React from "react";
import styles from "./index.module.scss";

// 帧序列 360 查看器：拖动旋转 + 滚轮放大。frames 为一组有序帧图 [{ src }]。
// active 控制显隐（与同级的 image/video 切换一致）；仅在 active 时预加载帧图，省流量。
export default function SpinViewer({ frames, active }) {
  const stageRef = React.useRef(null);
  const imgRef = React.useRef(null);
  const stateRef = React.useRef({
    cur: 0,
    dragging: false,
    lastX: 0,
    acc: 0,
    scale: 1,
  });
  const [loaded, setLoaded] = React.useState(0);
  const [zoom, setZoom] = React.useState(1);

  const N = frames?.length || 0;
  const STEP = 8; // 每 8px 切一帧

  const show = React.useCallback(
    (idx) => {
      if (N === 0) return;
      const st = stateRef.current;
      st.cur = ((idx % N) + N) % N;
      if (imgRef.current) imgRef.current.src = frames[st.cur].src;
    },
    [frames, N]
  );

  // 预加载（仅 active 时）
  React.useEffect(() => {
    if (!active || N === 0) return;
    let cnt = 0;
    let cancelled = false;
    frames.forEach((f) => {
      const im = new Image();
      im.onload = im.onerror = () => {
        if (!cancelled) setLoaded((cnt += 1));
      };
      im.src = f.src;
    });
    return () => {
      cancelled = true;
    };
  }, [active, frames, N]);

  // 自动转一圈，提示可交互
  React.useEffect(() => {
    if (!active || N === 0) return;
    show(stateRef.current.cur);
    let auto = 0;
    const timer = setInterval(() => {
      const st = stateRef.current;
      if (auto >= N) {
        clearInterval(timer);
        return;
      }
      if (!st.dragging) {
        show(st.cur + 1);
        auto += 1;
      }
    }, 70);
    return () => clearInterval(timer);
  }, [active, N, show]);

  const onMove = React.useCallback(
    (x) => {
      const st = stateRef.current;
      if (!st.dragging) return;
      const dx = x - st.lastX;
      st.lastX = x;
      st.acc += dx;
      while (Math.abs(st.acc) >= STEP) {
        if (st.acc > 0) {
          show(st.cur + 1);
          st.acc -= STEP;
        } else {
          show(st.cur - 1);
          st.acc += STEP;
        }
      }
    },
    [show]
  );

  const onDown = (x) => {
    const st = stateRef.current;
    st.dragging = true;
    st.lastX = x;
    st.acc = 0;
    stageRef.current?.classList.add(styles.grabbing);
  };

  const onUp = React.useCallback(() => {
    stateRef.current.dragging = false;
    stageRef.current?.classList.remove(styles.grabbing);
  }, []);

  // 全局监听拖动移动/松开（指针可能移出舞台）
  React.useEffect(() => {
    const mm = (e) => onMove(e.clientX);
    window.addEventListener("mousemove", mm);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", mm);
      window.removeEventListener("mouseup", onUp);
    };
  }, [onMove, onUp]);

  // 滚轮放大（原生绑定以便 preventDefault 生效）
  React.useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const onWheel = (e) => {
      e.preventDefault();
      const st = stateRef.current;
      const r = stage.getBoundingClientRect();
      const ox = ((e.clientX - r.left) / r.width) * 100;
      const oy = ((e.clientY - r.top) / r.height) * 100;
      st.scale = Math.max(1, Math.min(4, st.scale + (e.deltaY < 0 ? 0.25 : -0.25)));
      if (imgRef.current) {
        imgRef.current.style.transformOrigin = `${ox}% ${oy}%`;
        imgRef.current.style.transform = `scale(${st.scale})`;
      }
      setZoom(st.scale);
    };
    stage.addEventListener("wheel", onWheel, { passive: false });
    return () => stage.removeEventListener("wheel", onWheel);
  }, []);

  if (N === 0) return null;
  const ready = loaded >= 1;

  return (
    <div
      className={styles.spin_wrap}
      style={{ display: active ? "block" : "none" }}
    >
      <div className={styles.badge}>360°</div>
      <div className={styles.zoomtag}>×{zoom.toFixed(1)}</div>
      <div
        ref={stageRef}
        className={styles.stage}
        onMouseDown={(e) => {
          e.preventDefault();
          onDown(e.clientX);
        }}
        onTouchStart={(e) => onDown(e.touches[0].clientX)}
        onTouchMove={(e) => onMove(e.touches[0].clientX)}
        onTouchEnd={onUp}
      >
        {!ready ? <div className={styles.loading}>360°…</div> : null}
        <img ref={imgRef} className={styles.frame} alt="360" draggable="false" />
      </div>
    </div>
  );
}
