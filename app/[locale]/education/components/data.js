// ============================================================
// 钻石教育中心 · 4C 数据常量
//
// 所有 4C 交互组件的等级数据集中在此，UI 从这里取，避免数据散落各组件。
// label / description 均为英文默认值；面向用户的标题/引导文案在组件内用
// LANG?.["store.education.*"] || 英文兜底 渲染，运营补翻译后无需改组件。
//
// 注意：本文件被 "use client" 组件 import，纯常量、无副作用。
// ============================================================

// ---------- Color（颜色 D–Z）----------
// 分组：Colorless / Near Colorless / Faint / Very Light / Light
// tint：样本色块的浅黄叠加强度（0 = 无色，越大越偏黄），用于 CSS 渐变。
export const COLOR_GROUPS = [
  { key: "colorless", label: "Colorless" },
  { key: "near_colorless", label: "Near Colorless" },
  { key: "faint", label: "Faint" },
  { key: "very_light", label: "Very Light" },
  { key: "light", label: "Light" }
];

export const COLOR_GRADES = [
  { key: "D", group: "colorless", recommended: true, tint: 0.0 },
  { key: "E", group: "colorless", recommended: true, tint: 0.02 },
  { key: "F", group: "colorless", recommended: true, tint: 0.05 },
  { key: "G", group: "near_colorless", recommended: true, tint: 0.09 },
  { key: "H", group: "near_colorless", recommended: true, tint: 0.13 },
  { key: "I", group: "near_colorless", recommended: true, tint: 0.18 },
  { key: "J", group: "near_colorless", recommended: true, tint: 0.23 },
  { key: "K", group: "faint", recommended: false, tint: 0.3 },
  { key: "L", group: "faint", recommended: false, tint: 0.37 },
  { key: "M", group: "faint", recommended: false, tint: 0.44 },
  { key: "N", group: "very_light", recommended: false, tint: 0.52 },
  { key: "O", group: "very_light", recommended: false, tint: 0.58 },
  { key: "P", group: "very_light", recommended: false, tint: 0.64 },
  { key: "Q", group: "very_light", recommended: false, tint: 0.7 },
  { key: "R", group: "very_light", recommended: false, tint: 0.76 },
  { key: "S", group: "light", recommended: false, tint: 0.82 },
  { key: "T", group: "light", recommended: false, tint: 0.86 },
  { key: "U", group: "light", recommended: false, tint: 0.89 },
  { key: "V", group: "light", recommended: false, tint: 0.92 },
  { key: "W", group: "light", recommended: false, tint: 0.95 },
  { key: "X", group: "light", recommended: false, tint: 0.97 },
  { key: "Y", group: "light", recommended: false, tint: 0.99 },
  { key: "Z", group: "light", recommended: false, tint: 1.0 }
];

// 分组级描述（按 group key）。组件优先取 LANG 的同名 key，回退到这里。
export const COLOR_GROUP_DESCRIPTIONS = {
  colorless:
    "The highest color grades. These diamonds show no discernible color and let the most light through, giving an icy, pure-white appearance.",
  near_colorless:
    "Color is nearly undetectable to the untrained eye, especially once mounted. G–J offers the best balance of beauty and value for engagement rings.",
  faint:
    "A faint warmth becomes noticeable, particularly in larger stones or yellow-gold settings, where the tint can actually look complementary.",
  very_light:
    "A light yellow tint is visible to most viewers. These grades are typically chosen for a deliberately warm look or a tighter budget.",
  light:
    "A more obvious yellow tint is present throughout the stone. Outside of fancy-color diamonds, these grades are uncommon in fine jewelry."
};

export const COLOR_DEFAULT = "G";

// ---------- Clarity（净度 FL–I3）----------
// inclusions：确定性内含物数量（用于 SVG 斑点布局，越低净度越多）。
// eyeClean：是否通常肉眼无瑕。
export const CLARITY_GRADES = [
  {
    key: "FL",
    label: "FL",
    name: "Flawless",
    inclusions: 0,
    eyeClean: true,
    description:
      "No inclusions or blemishes visible under 10x magnification. Exceptionally rare and the benchmark of clarity."
  },
  {
    key: "IF",
    label: "IF",
    name: "Internally Flawless",
    inclusions: 0,
    eyeClean: true,
    description:
      "No internal inclusions under 10x magnification; only minor surface blemishes. Visually indistinguishable from Flawless."
  },
  {
    key: "VVS1",
    label: "VVS1",
    name: "Very Very Slightly Included 1",
    inclusions: 1,
    eyeClean: true,
    description:
      "Inclusions are extremely difficult to see even under 10x magnification. Completely eye-clean."
  },
  {
    key: "VVS2",
    label: "VVS2",
    name: "Very Very Slightly Included 2",
    inclusions: 2,
    eyeClean: true,
    description:
      "Minute inclusions are very difficult to detect under magnification. Completely eye-clean."
  },
  {
    key: "VS1",
    label: "VS1",
    name: "Very Slightly Included 1",
    inclusions: 3,
    eyeClean: true,
    description:
      "Minor inclusions are visible under magnification but not to the naked eye. An excellent value-to-quality choice."
  },
  {
    key: "VS2",
    label: "VS2",
    name: "Very Slightly Included 2",
    inclusions: 5,
    eyeClean: true,
    description:
      "Inclusions are noticeable under 10x magnification yet typically remain invisible to the naked eye."
  },
  {
    key: "SI1",
    label: "SI1",
    name: "Slightly Included 1",
    inclusions: 8,
    eyeClean: true,
    description:
      "Inclusions are easy to see under magnification and usually still eye-clean — often the smart-value sweet spot."
  },
  {
    key: "SI2",
    label: "SI2",
    name: "Slightly Included 2",
    inclusions: 12,
    eyeClean: false,
    description:
      "Inclusions are noticeable under magnification and may be visible to the naked eye depending on placement."
  },
  {
    key: "I1",
    label: "I1",
    name: "Included 1",
    inclusions: 18,
    eyeClean: false,
    description:
      "Inclusions are obvious under magnification and visible to the naked eye, which can affect brilliance."
  },
  {
    key: "I2",
    label: "I2",
    name: "Included 2",
    inclusions: 26,
    eyeClean: false,
    description:
      "Prominent inclusions are clearly visible to the naked eye and may impact durability and sparkle."
  },
  {
    key: "I3",
    label: "I3",
    name: "Included 3",
    inclusions: 36,
    eyeClean: false,
    description:
      "Heavy inclusions are very obvious to the naked eye and noticeably reduce transparency and brilliance."
  }
];

export const CLARITY_DEFAULT = "VS1";

// ---------- Cut（切工 Excellent–Poor）----------
// brightness：0–1，驱动 SVG 反光强度。
// rays：可视化的光线/反光条数量。
// leakage：0–1，漏光程度（中心暗区），越大越暗。
export const CUT_GRADES = [
  {
    key: "EX",
    label: "Excellent",
    recommended: true,
    brightness: 1.0,
    rays: 16,
    leakage: 0.0,
    description:
      "Maximizes brilliance and fire. Light enters and reflects back through the top with virtually no leakage, delivering the most sparkle."
  },
  {
    key: "VG",
    label: "Very Good",
    recommended: true,
    brightness: 0.82,
    rays: 12,
    leakage: 0.12,
    description:
      "Reflects nearly as much light as an Excellent cut at a more accessible price. The difference is hard to spot for most eyes."
  },
  {
    key: "GD",
    label: "Good",
    recommended: false,
    brightness: 0.6,
    rays: 8,
    leakage: 0.28,
    description:
      "Reflects a reasonable amount of light and offers solid value, though the sparkle is visibly less lively than higher grades."
  },
  {
    key: "FR",
    label: "Fair",
    recommended: false,
    brightness: 0.38,
    rays: 5,
    leakage: 0.5,
    description:
      "Allows noticeable light to escape from the sides and bottom, resulting in a duller appearance with limited brilliance."
  },
  {
    key: "PR",
    label: "Poor",
    recommended: false,
    brightness: 0.2,
    rays: 3,
    leakage: 0.72,
    description:
      "Significant light leakage leaves the diamond looking dark and glassy. Generally not recommended for fine jewelry."
  }
];

export const CUT_DEFAULT = "EX";

// ---------- Carat（克拉 → mm 直径，round brilliant 近似）----------
// 用于俯视 SVG 等比缩放；表中缺失的克拉数线性插值。
export const CARAT_MM_TABLE = [
  { carat: 0.25, mm: 4.1 },
  { carat: 0.5, mm: 5.2 },
  { carat: 0.75, mm: 5.9 },
  { carat: 1.0, mm: 6.5 },
  { carat: 1.25, mm: 6.9 },
  { carat: 1.5, mm: 7.4 },
  { carat: 2.0, mm: 8.2 },
  { carat: 2.5, mm: 8.8 },
  { carat: 3.0, mm: 9.4 },
  { carat: 4.0, mm: 10.4 },
  { carat: 5.0, mm: 11.1 }
];

export const CARAT_MIN = 0.25;
export const CARAT_MAX = 5.0;
export const CARAT_STEP = 0.25;
export const CARAT_DEFAULT = 1.0;

// 线性插值 carat → mm 直径。超出表范围则夹到端点。
export function caratToMm(carat) {
  const t = CARAT_MM_TABLE;
  if (carat <= t[0].carat) return t[0].mm;
  if (carat >= t[t.length - 1].carat) return t[t.length - 1].mm;
  for (let i = 0; i < t.length - 1; i++) {
    const a = t[i];
    const b = t[i + 1];
    if (carat >= a.carat && carat <= b.carat) {
      const ratio = (carat - a.carat) / (b.carat - a.carat);
      return a.mm + ratio * (b.mm - a.mm);
    }
  }
  return t[t.length - 1].mm;
}
