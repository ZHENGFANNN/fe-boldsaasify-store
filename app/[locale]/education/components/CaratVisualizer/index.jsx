"use client";

// CaratVisualizer · 克拉尺寸滑块
// 滑块 0.25–5.0 ct（步进 0.25），按真实 mm 直径等比缩放俯视圆钻 SVG，
// 标出 mm 值 + "Carat is a measure of weight, not size" 提示。默认 1.0 ct。

import React from "react";
import styles from "./index.module.scss";
import {
  CARAT_MIN,
  CARAT_MAX,
  CARAT_STEP,
  CARAT_DEFAULT,
  caratToMm
} from "../data.js";

const VB = 260;
const C = VB / 2;
// 1.0ct(6.5mm) 映射到约 96px 半径作基准，按 mm 线性缩放（视觉对比，非 1:1 物理像素）。
const PX_PER_MM = 14.7; // 6.5mm * 14.7 ≈ 95.5px
const MAX_R = (VB / 2) * 0.92;

export default function CaratVisualizer({ LANG, embedded }) {
  const [carat, setCarat] = React.useState(CARAT_DEFAULT);
  // 唯一渐变 id：同页多实例（如 PDP 复用）时避免 url(#id) 撞车。
  const gradId = `caratBody-${React.useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const mm = caratToMm(carat);
  const radius = Math.min(MAX_R, (mm * PX_PER_MM) / 2);

  return (
    <div
      className={`${styles.wrap} ${embedded ? styles.embedded : ""}`}
      data-role="education-carat-visualizer"
    >
      <div className={styles.detail}>
        <div className={styles.stage}>
          <svg
            viewBox={`0 0 ${VB} ${VB}`}
            className={styles.diamond}
            role="img"
            aria-label={`${carat.toFixed(2)} carat diamond, ${mm.toFixed(
              1
            )} mm diameter`}
          >
            <defs>
              <radialGradient id={gradId} cx="40%" cy="34%" r="72%">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="58%" stopColor="#eef2f6" />
                <stop offset="100%" stopColor="#d4dde5" />
              </radialGradient>
            </defs>
            {/* 参考刻度环（最大尺寸轮廓，浅灰虚线） */}
            <circle
              cx={C}
              cy={C}
              r={MAX_R}
              fill="none"
              stroke="#e6e3dd"
              strokeWidth="1"
              strokeDasharray="3 5"
            />
            {/* 钻石俯视圆 */}
            <circle
              cx={C}
              cy={C}
              r={radius}
              fill={`url(#${gradId})`}
              stroke="#c7cdd4"
              strokeWidth="1.5"
              className={styles.gem}
            />
            {/* 简化刻面：八边形台面 + 放射线 */}
            <g stroke="#cdd4db" strokeWidth="1" fill="none" opacity="0.7">
              <polygon points={octagonPoints(C, C, radius * 0.6)} />
              {radialLines(C, C, radius * 0.6, radius).map((l, i) => (
                <line key={i} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} />
              ))}
            </g>
          </svg>
        </div>

        <div className={styles.controls}>
          <div className={styles.readout}>
            <span className={styles.carat}>{carat.toFixed(2)}</span>
            <span className={styles.unit}>
              {LANG?.["store.education.carat_unit"] || "ct"}
            </span>
            <span className={styles.mm}>≈ {mm.toFixed(1)} mm</span>
          </div>

          <input
            type="range"
            className={styles.slider}
            min={CARAT_MIN}
            max={CARAT_MAX}
            step={CARAT_STEP}
            value={carat}
            onChange={(e) => setCarat(parseFloat(e.target.value))}
            aria-label={LANG?.["store.education.carat_aria"] || "Carat weight"}
          />
          <div className={styles.sliderEnds}>
            <span>{CARAT_MIN.toFixed(2)} ct</span>
            <span>{CARAT_MAX.toFixed(2)} ct</span>
          </div>

          <p className={styles.note}>
            {LANG?.["store.education.carat_note"] ||
              "Carat is a measure of weight, not size. Two diamonds of equal carat can look different depending on their cut and shape."}
          </p>
        </div>
      </div>
    </div>
  );
}

function octagonPoints(cx, cy, r) {
  const pts = [];
  for (let i = 0; i < 8; i++) {
    const a = (Math.PI / 4) * i + Math.PI / 8;
    pts.push(`${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`);
  }
  return pts.join(" ");
}

function radialLines(cx, cy, rInner, rOuter) {
  const lines = [];
  for (let i = 0; i < 8; i++) {
    const a = (Math.PI / 4) * i + Math.PI / 8;
    lines.push({
      x1: cx + rInner * Math.cos(a),
      y1: cy + rInner * Math.sin(a),
      x2: cx + rOuter * Math.cos(a),
      y2: cy + rOuter * Math.sin(a)
    });
  }
  return lines;
}
