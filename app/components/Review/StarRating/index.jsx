"use client";

import React from "react";
import { StarIcon, StarActiveIcon } from "@/components/Icon";
import styles from "./index.module.scss";

// 星星之间的间隔（px），展示态与输入态共用。
const GAP = 2;

/**
 * StarRating —— 可复用星级组件（展示 + 输入）。
 *
 * 展示态（readOnly，默认）：灰底 5 星 + 金星按 value/max 百分比裁切，支持小数星级（如 4.3）。
 * 输入态（readOnly=false）：整数打分，hover 高亮，点击回调 onChange(n)。账户端评价弹窗可复用。
 *
 * @param {number} value    当前分值（展示态可小数，输入态取整数高亮）
 * @param {number} max      满分星数，默认 5
 * @param {number} size     单颗星边长 px，默认 16
 * @param {boolean} readOnly 是否只读（展示态），默认 true
 * @param {(n:number)=>void} onChange 输入态点击回调
 */
export default function StarRating({
  value = 0,
  max = 5,
  size = 16,
  readOnly = true,
  onChange,
  className = "",
  ariaLabel,
}) {
  const [hover, setHover] = React.useState(0);

  const clamped = Math.max(0, Math.min(max, Number(value) || 0));
  const totalWidth = size * max + GAP * (max - 1);

  // 展示态：灰底 + 金星按百分比裁切（支持小数星级）
  if (readOnly) {
    const pct = (clamped / max) * 100;
    return (
      <div
        className={`${styles.stars} ${className}`.trim()}
        style={{ width: totalWidth, height: size }}
        role="img"
        aria-label={ariaLabel || `${clamped} / ${max}`}
        data-role="star-rating"
      >
        <div className={styles.base} style={{ gap: GAP }}>
          {Array.from({ length: max }).map((_, i) => (
            <StarIcon key={i} width={size} height={size} />
          ))}
        </div>
        <div className={styles.fill} style={{ width: `${pct}%` }}>
          <div
            className={styles.fill_inner}
            style={{ width: totalWidth, gap: GAP }}
          >
            {Array.from({ length: max }).map((_, i) => (
              <StarActiveIcon key={i} width={size} height={size} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // 输入态：整数打分，hover 预览高亮
  const active = hover || clamped;
  return (
    <div
      className={`${styles.stars} ${styles.input} ${className}`.trim()}
      style={{ height: size, gap: GAP }}
      role="radiogroup"
      aria-label={ariaLabel || "rating"}
      data-role="star-rating-input"
    >
      {Array.from({ length: max }).map((_, i) => {
        const idx = i + 1;
        const Icon = idx <= active ? StarActiveIcon : StarIcon;
        return (
          <button
            type="button"
            key={i}
            className={styles.star_btn}
            style={{ width: size, height: size }}
            role="radio"
            aria-checked={idx === Math.round(clamped)}
            aria-label={String(idx)}
            onMouseEnter={() => setHover(idx)}
            onMouseLeave={() => setHover(0)}
            onClick={() => onChange && onChange(idx)}
          >
            <Icon width={size} height={size} />
          </button>
        );
      })}
    </div>
  );
}
