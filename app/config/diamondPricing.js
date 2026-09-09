/** @format */

// ============================================================
// 培育钻中心石「估价表」+ 估价引擎（纯前端、纯函数、无副作用）
//
// 为什么价目表放前端而不是后端：
//   本站只卖戒托（每个 engagement-rings 商品的 ct. tw. 都是配石总重，
//   商详页明说 "This setting is sold on its own so you can pair it with the
//   centre stone you choose separately"）。中心石不是 SKU、库存里查不到，
//   所以没有任何「真实价」可取——这张表是给顾客的**市场行情参考**，
//   不是可下单价格。既然如此就没必要为它加后端接口，构建期烤进 JS 即可，
//   顺带让 /quote 保持纯 SSG、零运行时依赖。
//
//   ⚠️ 反过来说：戒托价**绝不**写在这里。戒托是真实 SKU，价格必须走
//   /api/products-offer 按 area 实时取（QuoteEstimator 已这么做），
//   否则估价页会报出一个跟商详页不一致的数字——高客单价品类上这是信任事故。
//
// 币种：本站当前只有 USD 单市场（fetch-data/globalConfig setting.markets 仅一条，
//   iso_code=USD）。表以 USD 计价；若将来接入非 USD 市场，isUsdBasis() 会返回
//   false，UI 需据此标注「USD 参考价」而不是直接套用当地货币符号——
//   countryMap 只有 symbol/ISO，没有汇率，静默换算等于报错价。
//
// 口径与量纲：
//   本文件所有价格都是「元」级浮点（如 1100 = $1,100.00），
//   不是后端 product_price 那种「分」级整数。跨到戒托价合并时必须先统一，
//   见 QuoteEstimator 里的 settingPriceInMajorUnit()。
// ============================================================

/** 表的锚点与生成基准，用于 UI 免责声明与将来校准时对齐口径。 */
export const PRICE_BASIS = {
  /** 锚点规格：1.00ct 圆形明亮式 / G / VS1 / Excellent 切工 */
  anchor: { carat: 1.0, shape: "round", color: "G", clarity: "VS1", cut: "excellent" },
  /** 锚点价（USD） */
  anchorPrice: 1100,
  /** 表的编制时间：培育钻价格逐年下行，过期需重新校准 */
  revisedAt: "2026-09",
  currency: "USD",
};

// ------------------------------------------------------------
// 1) 克拉基准价（USD）—— 圆形 / G / VS1 / Excellent
//
// 刻意写成显式查表而不是连续公式：培育钻的价格曲线不是光滑的，
// 在 1.00 / 1.50 / 2.00ct 这些「整数关口」(magic sizes) 有台阶
// —— 0.90→1.00ct 只多 11% 重量、价格跳 ~29%，因为需求集中在整数刻度。
// 公式拟合不出这种台阶，且表格可被运营/采购逐行核价，改价不改逻辑。
// ------------------------------------------------------------
const CARAT_BASE_USD = [
  [0.3, 190],
  [0.4, 260],
  [0.5, 380],
  [0.6, 470],
  [0.7, 600],
  [0.8, 720],
  [0.9, 850],
  [1.0, 1100], // ← 锚点，整数关口台阶
  [1.2, 1420],
  [1.5, 1980], // ← 整数关口台阶
  [1.7, 2340],
  [2.0, 3100], // ← 整数关口台阶
  [2.5, 4350],
  [3.0, 5800],
  [3.5, 7450],
  [4.0, 9200],
  [5.0, 13200],
];

/** 可选克拉档位（UI 直接渲染成 chips，避免顾客输入 0.37ct 这种买不到的重量）。 */
export const CARAT_OPTIONS = CARAT_BASE_USD.map(([ct]) => ct);

// ------------------------------------------------------------
// 2) 形状系数（相对圆形 = 1.00）
//
// 圆形最贵不是营销话术而是出成率：圆形明亮式从原石到成品损耗约 60%，
// 花式切工（princess/emerald 等）能保留更多重量，故同重同级更便宜。
// slug 与首页 IndexDiamondShapes 的 SHAPES 完全一致（含 elongated-cushion），
// 这样 ?shape=oval 之类的 query 可以直接落到本页预选。
// ------------------------------------------------------------
const SHAPE_FACTOR = {
  round: 1.0,
  oval: 0.86,
  "elongated-cushion": 0.8,
  cushion: 0.78,
  princess: 0.74,
  emerald: 0.82,
  radiant: 0.8,
  pear: 0.83,
  marquise: 0.84,
  asscher: 0.79,
};

// ------------------------------------------------------------
// 3) 颜色系数（相对 G = 1.00）—— D..J
// 4) 净度系数（相对 VS1 = 1.00）—— FL..SI2
// ------------------------------------------------------------
const COLOR_FACTOR = {
  D: 1.3,
  E: 1.22,
  F: 1.13,
  G: 1.0,
  H: 0.92,
  I: 0.83,
  J: 0.74,
};

const CLARITY_FACTOR = {
  FL: 1.32,
  IF: 1.24,
  VVS1: 1.16,
  VVS2: 1.1,
  VS1: 1.0,
  VS2: 0.94,
  SI1: 0.86,
  SI2: 0.78,
};

// ------------------------------------------------------------
// 5) 切工系数（相对 Excellent = 1.00）
//
// 🔴 只对圆形有效。GIA/IGI 只给圆形明亮式出「Cut」等级，花式切工只评
// 抛光(Polish)与对称性(Symmetry)，没有总切工分。所以花式形状一律按
// 1.00 计，UI 也不该显示切工选择器 —— 见 shapeHasCutGrade()。
// ------------------------------------------------------------
const CUT_FACTOR = {
  ideal: 1.08,
  excellent: 1.0,
  "very-good": 0.92,
  good: 0.82,
};

/** 估价区间宽度：这是行情参考而非报价，±8% 表达不确定性。 */
const RANGE_SPREAD = 0.08;

// ---- UI 选项元数据（label 为英文兜底，运行时优先取 LANG） ----

export const SHAPE_OPTIONS = Object.keys(SHAPE_FACTOR);

export const COLOR_OPTIONS = [
  { code: "D", group: "Colorless" },
  { code: "E", group: "Colorless" },
  { code: "F", group: "Colorless" },
  { code: "G", group: "Near Colorless" },
  { code: "H", group: "Near Colorless" },
  { code: "I", group: "Near Colorless" },
  { code: "J", group: "Near Colorless" },
];

export const CLARITY_OPTIONS = [
  { code: "FL", label: "FL" },
  { code: "IF", label: "IF" },
  { code: "VVS1", label: "VVS1" },
  { code: "VVS2", label: "VVS2" },
  { code: "VS1", label: "VS1" },
  { code: "VS2", label: "VS2" },
  { code: "SI1", label: "SI1" },
  { code: "SI2", label: "SI2" },
];

export const CUT_OPTIONS = [
  { code: "ideal", label: "Ideal" },
  { code: "excellent", label: "Excellent" },
  { code: "very-good", label: "Very Good" },
  { code: "good", label: "Good" },
];

/** 默认选择：锚点规格（最常见的求婚钻规格，且系数全为 1，便于顾客理解基准）。 */
export const DEFAULT_SELECTION = {
  shape: "round",
  carat: 1.0,
  color: "G",
  clarity: "VS1",
  cut: "excellent",
};

/**
 * 该形状是否有权威切工等级（只有圆形有）。
 * UI 据此决定是否渲染切工选择器；花式形状按 1.00 计不打折不加价。
 */
export function shapeHasCutGrade(shape) {
  return shape === "round";
}

/** 本站当前币种是否 USD（表的计价基准）。非 USD 时 UI 需标注「USD 参考」。 */
export function isUsdBasis(currencyIso) {
  if (!currencyIso) return true; // 取不到时按站点默认(USD)处理，不吓用户
  return String(currencyIso).toUpperCase() === "USD";
}

/**
 * 按克拉取基准价：命中档位直接取，档位之间线性插值，超出两端做边界截断。
 * 插值只在相邻档位间发生，不会抹平整数关口台阶（台阶本身就是档位边界）。
 */
function baseUsdForCarat(carat) {
  const ct = Number(carat);
  if (!isFinite(ct) || ct <= 0) return 0;

  const table = CARAT_BASE_USD;
  if (ct <= table[0][0]) return table[0][1];
  const last = table[table.length - 1];
  if (ct >= last[0]) {
    // 超过最大档位：按最后一段的斜率外推，避免大石头价格被压平。
    const prev = table[table.length - 2];
    const slope = (last[1] - prev[1]) / (last[0] - prev[0]);
    return last[1] + (ct - last[0]) * slope;
  }
  for (let i = 0; i < table.length - 1; i += 1) {
    const [c0, p0] = table[i];
    const [c1, p1] = table[i + 1];
    if (ct >= c0 && ct <= c1) {
      if (c1 === c0) return p0;
      const t = (ct - c0) / (c1 - c0);
      return p0 + t * (p1 - p0);
    }
  }
  return last[1];
}

/**
 * 估算中心石价格。
 *
 * @param selection { shape, carat, color, clarity, cut }
 * @returns {{
 *   estimate: number, low: number, high: number,   // USD「元」级
 *   factors: { carat: number, shape: number, color: number, clarity: number, cut: number },
 *   valid: boolean
 * }}
 *   任一维度取值非法（不在表内）时 valid=false 且价格为 0，调用方应显示占位而不是 $0。
 */
export function estimateDiamondPrice(selection = {}) {
  // 🔴 刻意**不**用 `{...DEFAULT_SELECTION, ...selection}` 兜底缺失字段。
  // 那样写 estimateDiamondPrice({}) 会静默返回「round / 1ct / G / VS1」的
  // $1,100 且 valid:true —— 调用方漏传参数时拿到一个看起来很权威的假数字，
  // 在高客单价场景里是最坏的失败方式。缺字段 = 无效输入,直接 valid:false,
  // 由 UI 决定怎么显示。DEFAULT_SELECTION 只用于初始化组件 state。
  const { shape, carat, color, clarity, cut } = selection;

  const base = baseUsdForCarat(carat);
  const fShape = SHAPE_FACTOR[shape];
  const fColor = COLOR_FACTOR[color];
  const fClarity = CLARITY_FACTOR[clarity];
  // 花式切工无权威切工等级 → 恒 1.00，忽略传入的 cut。
  const fCut = shapeHasCutGrade(shape) ? CUT_FACTOR[cut] : 1.0;

  const valid =
    base > 0 &&
    typeof fShape === "number" &&
    typeof fColor === "number" &&
    typeof fClarity === "number" &&
    typeof fCut === "number";

  if (!valid) {
    return {
      estimate: 0,
      low: 0,
      high: 0,
      factors: { carat: 0, shape: 0, color: 0, clarity: 0, cut: 0 },
      valid: false,
    };
  }

  const raw = base * fShape * fColor * fClarity * fCut;
  // 取整到 $10：估价给到个位数是假精度，反而显得不可信。
  const estimate = Math.round(raw / 10) * 10;
  const low = Math.round((raw * (1 - RANGE_SPREAD)) / 10) * 10;
  const high = Math.round((raw * (1 + RANGE_SPREAD)) / 10) * 10;

  return {
    estimate,
    low,
    high,
    factors: { carat: base, shape: fShape, color: fColor, clarity: fClarity, cut: fCut },
    valid: true,
  };
}

/** 克拉数展示：1 → "1.00", 0.5 → "0.50"（钻石行业惯例两位小数）。 */
export function formatCarat(carat) {
  const ct = Number(carat);
  if (!isFinite(ct)) return "—";
  return ct.toFixed(2);
}

/** 形状 slug → 英文 label 兜底（LANG 命中时优先用 LANG）。 */
export function shapeLabel(slug) {
  return String(slug || "")
    .split("-")
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");
}
