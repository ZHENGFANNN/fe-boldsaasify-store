"use client";

// ColorScale · 颜色等级 D–Z 交互刻度
// 点击/拖动刻度条选中等级 → 高亮、展示分组/描述/随等级加深的样本色块。
// D–J 标 "Recommended for engagement rings" 徽章。默认 G。

import React from "react";
import styles from "./index.module.scss";
import {
  COLOR_GRADES,
  COLOR_GROUPS,
  COLOR_GROUP_DESCRIPTIONS,
  COLOR_DEFAULT
} from "../data.js";

export default function ColorScale({ LANG }) {
  const [selected, setSelected] = React.useState(COLOR_DEFAULT);
  const trackRef = React.useRef(null);
  const draggingRef = React.useRef(false);

  const grade = COLOR_GRADES.find((g) => g.key === selected) || COLOR_GRADES[0];
  const group = COLOR_GROUPS.find((gr) => gr.key === grade.group);
  const groupLabel = LANG?.[`store.education.color_group_${grade.group}`] || group?.label;
  const groupDesc =
    LANG?.[`store.education.color_desc_${grade.group}`] ||
    COLOR_GROUP_DESCRIPTIONS[grade.group];

  // 样本色块：从无色到浅黄，tint 越大越偏暖黄。
  const tint = grade.tint;
  const sampleStyle = {
    background: `linear-gradient(135deg,
      rgba(255,255,255,0.96),
      rgba(${248 - tint * 18}, ${246 - tint * 30}, ${238 - tint * 110}, 1))`
  };

  function pickByClientX(clientX) {
    const track = trackRef.current;
    if (!track) return;
    const rect = track.getBoundingClientRect();
    if (rect.width <= 0) return;
    let ratio = (clientX - rect.left) / rect.width;
    ratio = Math.min(1, Math.max(0, ratio));
    const idx = Math.round(ratio * (COLOR_GRADES.length - 1));
    setSelected(COLOR_GRADES[idx].key);
  }

  function onPointerDown(e) {
    draggingRef.current = true;
    pickByClientX(e.clientX);
  }
  function onPointerMove(e) {
    if (!draggingRef.current) return;
    pickByClientX(e.clientX);
  }
  function stopDrag() {
    draggingRef.current = false;
  }

  function onKeyDown(e) {
    const idx = COLOR_GRADES.findIndex((g) => g.key === selected);
    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      e.preventDefault();
      setSelected(COLOR_GRADES[Math.min(COLOR_GRADES.length - 1, idx + 1)].key);
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault();
      setSelected(COLOR_GRADES[Math.max(0, idx - 1)].key);
    }
  }

  return (
    <div className={styles.wrap} data-role="education-color-scale">
      <div className={styles.scaleArea}>
        <div className={styles.scaleScroll}>
          <div
            className={styles.track}
            ref={trackRef}
            role="slider"
            tabIndex={0}
            aria-label={LANG?.["store.education.color_aria"] || "Diamond color grade"}
            aria-valuetext={grade.key}
            onKeyDown={onKeyDown}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={stopDrag}
            onPointerLeave={stopDrag}
          >
            {COLOR_GRADES.map((g) => (
              <button
                key={g.key}
                type="button"
                className={`${styles.tick} ${
                  g.key === selected ? styles.tickActive : ""
                }`}
                onClick={() => setSelected(g.key)}
                aria-pressed={g.key === selected}
              >
                <span
                  className={styles.tickSwatch}
                  style={{
                    background: `rgb(${248 - g.tint * 18}, ${
                      246 - g.tint * 30
                    }, ${238 - g.tint * 110})`
                  }}
                />
                <span className={styles.tickLabel}>{g.key}</span>
              </button>
            ))}
          </div>
        </div>
        <div className={styles.scaleEnds}>
          <span>{LANG?.["store.education.color_end_colorless"] || "Colorless"}</span>
          <span>{LANG?.["store.education.color_end_light"] || "Light"}</span>
        </div>
      </div>

      <div className={styles.detail}>
        <div className={styles.sample} style={sampleStyle} aria-hidden="true">
          <span className={styles.sampleGrade}>{grade.key}</span>
        </div>
        <div className={styles.info}>
          <div className={styles.infoHead}>
            <h4 className={styles.infoTitle}>
              {grade.key} · {groupLabel}
            </h4>
            {grade.recommended && (
              <span className={styles.badge}>
                {LANG?.["store.education.recommended_badge"] ||
                  "Recommended for engagement rings"}
              </span>
            )}
          </div>
          <p className={styles.infoDesc}>{groupDesc}</p>
        </div>
      </div>
    </div>
  );
}
