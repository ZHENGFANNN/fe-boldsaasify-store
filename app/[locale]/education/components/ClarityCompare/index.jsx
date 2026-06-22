"use client";

// ClarityCompare · 净度等级 FL–I3 交互对比
// 点选等级 → 放大圆钻 SVG 内确定性渲染内含物斑点（数量/大小/可见度随净度降低增加）。
// 展示描述 + eye-clean 提示。默认 VS1。

import React from "react";
import styles from "./index.module.scss";
import { CLARITY_GRADES, CLARITY_DEFAULT } from "../data.js";

// 钻石 SVG 视图坐标系
const VB = 240;
const C = VB / 2;
const R = 96; // 台面圆半径

// 确定性斑点布局：用黄金角螺旋排布，按 index 算坐标，不用随机。
// 返回 [{x, y, r, opacity}]，全部落在半径 R 的圆内。
function buildInclusions(count) {
  const spots = [];
  if (count <= 0) return spots;
  const golden = Math.PI * (3 - Math.sqrt(5)); // 黄金角 ≈ 2.39996
  for (let i = 0; i < count; i++) {
    // 半径用 sqrt 均匀铺面，留 8% 边距避免压在轮廓上
    const rr = Math.sqrt((i + 0.5) / count) * R * 0.82;
    const theta = i * golden;
    const x = C + rr * Math.cos(theta);
    const y = C + rr * Math.sin(theta);
    // 斑点大小/可见度随总数增加（越低净度越明显）
    const size = 1.4 + (count / 36) * 3.2 + (i % 3) * 0.5;
    const opacity = Math.min(0.85, 0.25 + (count / 36) * 0.6 + (i % 2) * 0.06);
    spots.push({ x, y, r: size, opacity });
  }
  return spots;
}

export default function ClarityCompare({ LANG }) {
  const [selected, setSelected] = React.useState(CLARITY_DEFAULT);
  const grade =
    CLARITY_GRADES.find((g) => g.key === selected) || CLARITY_GRADES[0];
  const inclusions = React.useMemo(
    () => buildInclusions(grade.inclusions),
    [grade.inclusions]
  );

  return (
    <div className={styles.wrap} data-role="education-clarity-compare">
      <div className={styles.gradeRow} role="tablist">
        {CLARITY_GRADES.map((g) => (
          <button
            key={g.key}
            type="button"
            role="tab"
            aria-selected={g.key === selected}
            className={`${styles.gradeBtn} ${
              g.key === selected ? styles.gradeActive : ""
            }`}
            onClick={() => setSelected(g.key)}
          >
            {g.label}
          </button>
        ))}
      </div>

      <div className={styles.detail}>
        <div className={styles.stage}>
          <svg
            viewBox={`0 0 ${VB} ${VB}`}
            className={styles.diamond}
            role="img"
            aria-label={`${grade.name} clarity`}
          >
            <defs>
              <radialGradient id="clarityFacet" cx="38%" cy="32%" r="75%">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="55%" stopColor="#eef2f6" />
                <stop offset="100%" stopColor="#d9e1e8" />
              </radialGradient>
            </defs>
            {/* 台面圆轮廓 */}
            <circle
              cx={C}
              cy={C}
              r={R}
              fill="url(#clarityFacet)"
              stroke="#c7cdd4"
              strokeWidth="1.5"
            />
            {/* 刻面线（八边形台面 + 放射线，营造钻石感） */}
            <g stroke="#cdd4db" strokeWidth="1" fill="none" opacity="0.7">
              <polygon
                points={octagonPoints(C, C, R * 0.6)}
              />
              {radialLines(C, C, R * 0.6, R).map((l, i) => (
                <line key={i} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} />
              ))}
            </g>
            {/* 内含物斑点 */}
            <g>
              {inclusions.map((s, i) => (
                <circle
                  key={i}
                  cx={s.x}
                  cy={s.y}
                  r={s.r}
                  fill="#3a3f45"
                  opacity={s.opacity}
                />
              ))}
            </g>
          </svg>
          <span className={styles.magHint}>
            {LANG?.["store.education.clarity_mag_hint"] || "Shown at 10x magnification"}
          </span>
        </div>

        <div className={styles.info}>
          <div className={styles.infoHead}>
            <h4 className={styles.infoTitle}>
              {grade.label} · {grade.name}
            </h4>
            <span
              className={`${styles.eye} ${
                grade.eyeClean ? styles.eyeClean : styles.eyeNot
              }`}
            >
              {grade.eyeClean
                ? LANG?.["store.education.clarity_eye_clean"] || "Eye-clean"
                : LANG?.["store.education.clarity_eye_visible"] ||
                  "Visible to the naked eye"}
            </span>
          </div>
          <p className={styles.infoDesc}>{grade.description}</p>
          <p className={styles.note}>
            {LANG?.["store.education.clarity_note"] ||
              "VS2 / SI1 and above are typically eye-clean — a smart way to balance beauty and budget."}
          </p>
        </div>
      </div>
    </div>
  );
}

// 八边形顶点字符串
function octagonPoints(cx, cy, r) {
  const pts = [];
  for (let i = 0; i < 8; i++) {
    const a = (Math.PI / 4) * i + Math.PI / 8;
    pts.push(`${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`);
  }
  return pts.join(" ");
}

// 从内八边形顶点向外缘的放射线
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
