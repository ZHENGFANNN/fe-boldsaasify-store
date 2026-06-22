"use client";

import React from "react";

// 占位演示用：运行时生成一组「钻戒绕垂直轴旋转」的 SVG 帧（同源 data URI），
// 仅在商品页 URL 带 ?spin=demo 时启用，用于在接入真实 spin_list 数据前预览 360 查看器效果。
// 正式数据走 productInfo.spin_list（一组有序帧图 [{ src }]）。

const DEMO_AMOUNT = 36;

function genFrameSvg(i, n) {
  const a = (i / n) * Math.PI * 2;
  const cx = 200;
  const cyD = 150;
  const cyR = 250;
  const dw = 78 * Math.abs(Math.cos(a)) + 7; // 主钻半宽，随视角压缩
  const rRx = 70 * Math.abs(Math.sin(a)) + 9; // 戒圈水平半径，与钻不同相位
  const markX = Math.cos(a) >= 0 ? cx + dw * 0.55 : cx - dw * 0.55; // 朝向标记
  const deg = Math.round((i / n) * 360);
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="320" viewBox="0 0 400 320">` +
    `<rect width="400" height="320" fill="#ffffff"/>` +
    `<ellipse cx="${cx}" cy="${cyR}" rx="${rRx}" ry="58" fill="none" stroke="#d4af37" stroke-width="14"/>` +
    `<ellipse cx="${cx}" cy="${cyR}" rx="${rRx}" ry="58" fill="none" stroke="#f3e3a8" stroke-width="4"/>` +
    `<polygon points="${cx},${cyD - 62} ${cx - dw},${cyD} ${cx},${cyD + 70} ${cx + dw},${cyD}" fill="#cfeaf5" stroke="#5b9bb5" stroke-width="2"/>` +
    `<line x1="${cx - dw}" y1="${cyD}" x2="${cx + dw}" y2="${cyD}" stroke="#5b9bb5" stroke-width="1.5"/>` +
    `<line x1="${cx}" y1="${cyD - 62}" x2="${cx}" y2="${cyD + 70}" stroke="#8cc3d6" stroke-width="1"/>` +
    `<line x1="${cx - dw * 0.5}" y1="${cyD - 31}" x2="${cx + dw * 0.5}" y2="${cyD - 31}" stroke="#8cc3d6" stroke-width="1"/>` +
    `<circle cx="${markX}" cy="${cyD - 10}" r="5" fill="#e0556b"/>` +
    `<text x="200" y="304" text-anchor="middle" font-family="Arial" font-size="13" fill="#b3a682">frame ${i + 1} / ${n}  ·  ${deg}°</text>` +
    `</svg>`;
  return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
}

export function genDemoSpinFrames(n = DEMO_AMOUNT) {
  return Array.from({ length: n }, (_, i) => ({ src: genFrameSvg(i, n) }));
}

function isSpinDemoRequested() {
  if (typeof window === "undefined") return false;
  return new URLSearchParams(window.location.search).get("spin") === "demo";
}

// 解析商品的 360 帧：优先真实 spin_list；否则在 ?spin=demo 下回落到占位帧；都没有则 null。
// demo 检测放在 effect 中（仅客户端），避免 SSR / 首屏 hydration 不一致。
export function useSpinFrames(productInfo) {
  const real =
    Array.isArray(productInfo?.spin_list) && productInfo.spin_list.length > 0
      ? productInfo.spin_list
      : null;
  const [frames, setFrames] = React.useState(real);
  React.useEffect(() => {
    if (!real && isSpinDemoRequested()) setFrames(genDemoSpinFrames());
  }, [real]);
  return frames;
}
