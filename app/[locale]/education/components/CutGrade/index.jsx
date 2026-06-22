"use client";

// CutGrade · 切工等级 Excellent–Poor 交互
// 点选等级 → 圆钻 SVG 用光线/反光与中心暗区可视化亮度：
// Excellent 多而亮的放射光线、近乎无漏光；Poor 暗淡、中心大片漏光。
// Excellent/Very Good 标推荐。默认 Excellent。

import React from "react";
import styles from "./index.module.scss";
import { CUT_GRADES, CUT_DEFAULT } from "../data.js";

const VB = 240;
const C = VB / 2;
const R = 96;

export default function CutGrade({ LANG }) {
  const [selected, setSelected] = React.useState(CUT_DEFAULT);
  const grade = CUT_GRADES.find((g) => g.key === selected) || CUT_GRADES[0];

  const { brightness, rays, leakage } = grade;
  // 放射光线：等角分布，长度/不透明度随 brightness。
  const rayList = [];
  for (let i = 0; i < rays; i++) {
    const a = (Math.PI * 2 * i) / rays + Math.PI / rays;
    const len = R * (0.45 + brightness * 0.5);
    rayList.push({
      x2: C + len * Math.cos(a),
      y2: C + len * Math.sin(a),
      opacity: 0.25 + brightness * 0.6,
      width: 1 + brightness * 1.6
    });
  }
  // 中心漏光暗区：leakage 越大半径越大、越暗。
  const leakR = R * (0.12 + leakage * 0.55);
  const leakOpacity = leakage * 0.55;

  return (
    <div className={styles.wrap} data-role="education-cut-grade">
      <div className={styles.gradeRow} role="tablist">
        {CUT_GRADES.map((g) => (
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
            {g.recommended && <span className={styles.dot} aria-hidden="true" />}
          </button>
        ))}
      </div>

      <div className={styles.detail}>
        <div className={styles.stage}>
          <svg
            viewBox={`0 0 ${VB} ${VB}`}
            className={styles.diamond}
            role="img"
            aria-label={`${grade.label} cut brilliance`}
          >
            <defs>
              <radialGradient id="cutBody" cx="42%" cy="36%" r="72%">
                <stop offset="0%" stopColor="#ffffff" />
                <stop
                  offset="60%"
                  stopColor={brightness > 0.6 ? "#eaf2fb" : "#e3e7ec"}
                />
                <stop
                  offset="100%"
                  stopColor={brightness > 0.6 ? "#cfe0f2" : "#bcc2c9"}
                />
              </radialGradient>
            </defs>

            <circle
              cx={C}
              cy={C}
              r={R}
              fill="url(#cutBody)"
              stroke="#c7cdd4"
              strokeWidth="1.5"
            />

            {/* 反光放射线（亮度可视化） */}
            <g
              stroke="#ffffff"
              strokeLinecap="round"
              style={{ transition: "opacity 320ms ease" }}
            >
              {rayList.map((ray, i) => (
                <line
                  key={i}
                  x1={C}
                  y1={C}
                  x2={ray.x2}
                  y2={ray.y2}
                  strokeWidth={ray.width}
                  opacity={ray.opacity}
                />
              ))}
            </g>

            {/* 高光点 */}
            {brightness > 0.5 && (
              <circle
                cx={C - R * 0.32}
                cy={C - R * 0.34}
                r={R * 0.1}
                fill="#ffffff"
                opacity={brightness * 0.7}
              />
            )}

            {/* 中心漏光暗区 */}
            <circle cx={C} cy={C} r={leakR} fill="#1f2327" opacity={leakOpacity} />
          </svg>
          <span className={styles.brightLabel}>
            {LANG?.["store.education.cut_brilliance_label"] || "Light return"}
            {" · "}
            {Math.round(brightness * 100)}%
          </span>
        </div>

        <div className={styles.info}>
          <div className={styles.infoHead}>
            <h4 className={styles.infoTitle}>{grade.label}</h4>
            {grade.recommended && (
              <span className={styles.badge}>
                {LANG?.["store.education.recommended_short"] || "Recommended"}
              </span>
            )}
          </div>
          <p className={styles.infoDesc}>{grade.description}</p>
          <p className={styles.note}>
            {LANG?.["store.education.cut_note"] ||
              "Cut has the biggest impact on a diamond's sparkle — prioritize it over the other Cs."}
          </p>
        </div>
      </div>
    </div>
  );
}
