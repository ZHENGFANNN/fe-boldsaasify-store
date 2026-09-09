/** @format */
"use client";

/**
 * QuoteEstimator —— /quote 页主体：中心石 4C 估价 + 真实戒托价 = 整环预算。
 *
 * 两种价格刻意分开对待，别在维护时把它们统一：
 *   - 中心石：前端行情表估价（@/config/diamondPricing），给区间、明确标注 estimate。
 *   - 戒托  ：真实 SKU 价，按 area cookie 调 /api/products-offer 取，与商详页同口径。
 *     未就绪显示骨架，取不到价显示缺货 —— 绝不用兜底假价填空。
 *
 * 布局：左选择器 + 右侧粘性汇总（桌面），≤1079 收成单列、汇总卡置底常驻。
 * URL ?shape=<slug> 可预选形状，与首页 IndexDiamondShapes 的 tile 链接对齐。
 */

import React from "react";
import Link from "next/link";
import styles from "./index.module.scss";
import { fillOssImage, formatCurrency } from "@/utils";
import useArea from "@/hooks/useArea";
import getProductsOffer from "@/service/product/get-offer";
import Skeleton from "@/components/Skeleton";
import { SHAPES } from "../../../components/IndexDiamondShapes/shapes";
import {
  CARAT_OPTIONS,
  CLARITY_OPTIONS,
  COLOR_OPTIONS,
  CUT_OPTIONS,
  DEFAULT_SELECTION,
  PRICE_BASIS,
  estimateDiamondPrice,
  formatCarat,
  isUsdBasis,
  shapeHasCutGrade,
  shapeLabel,
} from "@/config/diamondPricing";

// 🔴 后端 product_price 已经是「元」级的了，**不要**再除 currency_unit。
// currency_unit 的语义是精度因子(10^n)：全站 utils/roundToDecimalPlaces 的用法是
// `Math.round(value * unit) / unit`（四舍五入到 n 位小数），currencyDecimals 也据它
// 推小数位数 —— 它从来不是「分转元」的除数。
// 我最初按「分」理解除了一次，Ivy Trellis 的 2890 被渲染成 $28.90，而首页同一商品
// 显示 $2,890 —— 估价页和商详页对不上，在高客单价场景里就是信任事故。
function settingPriceInMajorUnit(areaInfo) {
  const raw = Number(areaInfo?.product_price);
  if (!isFinite(raw) || raw <= 0) return 0;
  return raw;
}

// 从批量取价结果挑该商品展示价：取首个有 areaInfo 的 combo（与首页各位一致）。
// 戒托的 combo 是「金属 × 配石重量」，价格随之不同；估价页只做预算量级，
// 故取首个可用 combo 作代表，并在 UI 标注「起」(from)。
function pickAreaInfo(pricingItem) {
  const combos = Array.isArray(pricingItem?.combos) ? pricingItem.combos : [];
  for (const c of combos) {
    if (c?.areaInfo) return c.areaInfo;
  }
  return null;
}

// 取该商品全部 combo 的最低价，作为「from」价（顾客看预算下限更有用）。
function pickLowestAreaInfo(pricingItem) {
  const combos = Array.isArray(pricingItem?.combos) ? pricingItem.combos : [];
  let best = null;
  let bestVal = Infinity;
  for (const c of combos) {
    const ai = c?.areaInfo;
    if (!ai) continue;
    const v = settingPriceInMajorUnit(ai);
    if (v > 0 && v < bestVal) {
      bestVal = v;
      best = ai;
    }
  }
  return best || pickAreaInfo(pricingItem);
}

// 从取价结果里解析站点币种（符号 / 最小单位 / ISO）。
// 提到组件外是刻意的：内联在 useMemo 里带多个 return 会让 React Compiler
// 报 "Existing memoization could not be preserved" 而跳过整个组件的编译优化。
// 纯函数 + 单一出口，既过编译器又保持可读。
//
// 🔴 currency_unit 必须做 >0 守卫：建站 seed 曾把该列种成 Go 零值 0，
// 直接拿去做除数会得到 NaN，整页金额变 $0.00（历史事故，勿删此守卫）。
function resolveCurrency(pricingMap) {
  const FALLBACK = { symbol: "$", unit: 100, iso: "USD" };
  if (!pricingMap) return null;
  let resolved = FALLBACK;
  for (const item of Object.values(pricingMap)) {
    const ai = pickAreaInfo(item);
    if (ai) {
      resolved = {
        symbol: ai.currency_symbol || "$",
        unit: Number(ai.currency_unit) > 0 ? Number(ai.currency_unit) : 100,
        iso: ai.currency || "USD",
      };
      break;
    }
  }
  return resolved;
}

export default function QuoteEstimator({ LANG = {}, locale, settings = [] }) {
  const { area, areaReady } = useArea();

  const T = (key, fallback) => LANG?.[key] || fallback;

  // ---- 选择态 ----
  const [selection, setSelection] = React.useState(DEFAULT_SELECTION);
  // 选中的戒托 key；null = 只估中心石（顾客可能还没挑戒托）。
  const [settingKey, setSettingKey] = React.useState(null);

  // ?shape=oval&carat=1.5 预选（shape 来自首页 Shop by Shape tile，
  // carat 来自首页 QuoteTeaserModule 的克拉快捷入口）。
  // 🔴 刻意不用 next/navigation 的 useSearchParams：它会让本页 CSR bailout，
  // 整页从 SSG 掉成动态渲染（构建期直接报 missing-suspense-with-csr-bailout 而失败）。
  // 预选只是锦上添花，改为挂载后读一次 window.location.search，页面保持纯静态。
  //
  // 两个参数都只接受「表里真实存在的值」：shape 必须命中 SHAPES，
  // carat 必须命中 CARAT_OPTIONS。拿 query 里的任意数字直接进 selection 会让
  // 定价函数收到表外克拉数 → 落到 valid:false 的空态，顾客看到的是一个坏页面。
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const qs = new URLSearchParams(window.location.search);
    const patch = {};

    const slug = qs.get("shape");
    if (slug) {
      const hit = SHAPES.find((s) => s.slug === slug);
      if (hit) patch.shape = hit.slug;
    }

    const rawCarat = qs.get("carat");
    if (rawCarat) {
      const ct = Number(rawCarat);
      // 浮点相等在这里是安全的：CARAT_OPTIONS 与 query 都是 0.5/1/1.5 这类
      // 短十进制字面量，Number("1.5") === 1.5 精确成立。
      if (Number.isFinite(ct) && CARAT_OPTIONS.includes(ct)) patch.carat = ct;
    }

    if (Object.keys(patch).length) setSelection((prev) => ({ ...prev, ...patch }));
  }, []);

  // ---- 戒托批量取价（真实价，按 area）----
  const settingKeys = React.useMemo(
    () =>
      settings
        .filter((s) => s.sort_key && s.key)
        .map((s) => ({ sortKey: s.sort_key, productKey: s.key })),
    [settings]
  );

  // null = 未就绪（显示骨架）
  const [pricingMap, setPricingMap] = React.useState(null);

  React.useEffect(() => {
    if (!areaReady || settingKeys.length === 0) {
      if (settingKeys.length === 0) setPricingMap({});
      return;
    }
    let cancelled = false;
    getProductsOffer({ area: area || "us", locale, keys: settingKeys }).then((data) => {
      if (cancelled) return;
      const map = {};
      (data?.list || []).forEach((item) => {
        map[`${item.sortKey}:${item.productKey}`] = item;
      });
      setPricingMap(map);
    });
    return () => {
      cancelled = true;
    };
  }, [areaReady, area, locale, settingKeys]);

  const pricingReady = pricingMap !== null;

  // 货币展示：从任意一条真实 areaInfo 取符号/精度（权威源是后端定价表，
  // 不从 countryMap 猜）。戒托全无价时回退 $ / unit 100。
  const currency = React.useMemo(() => resolveCurrency(pricingMap), [pricingMap]);

  const symbol = currency?.symbol || "$";
  const unit = currency?.unit || 100;
  // 表以 USD 编制；站点币种非 USD 时中心石估价需标注 USD 基准（无汇率不做静默换算）。
  const usdBasis = isUsdBasis(currency?.iso);

  const money = (v) => `${symbol}${formatCurrency(v, unit)}`;

  // ---- 中心石估价 ----
  const diamond = React.useMemo(() => estimateDiamondPrice(selection), [selection]);

  // ---- 选中戒托的真实价 ----
  const selectedSetting = React.useMemo(
    () => settings.find((s) => s.key === settingKey) || null,
    [settings, settingKey]
  );

  const selectedSettingAreaInfo = React.useMemo(() => {
    if (!selectedSetting || !pricingMap) return null;
    return pickLowestAreaInfo(pricingMap[`${selectedSetting.sort_key}:${selectedSetting.key}`]);
  }, [selectedSetting, pricingMap]);

  const settingPrice = settingPriceInMajorUnit(selectedSettingAreaInfo);

  // 总预算：中心石估价 + 戒托真实价。未选戒托时只给中心石。
  const total = diamond.valid ? diamond.estimate + settingPrice : 0;
  const totalLow = diamond.valid ? diamond.low + settingPrice : 0;
  const totalHigh = diamond.valid ? diamond.high + settingPrice : 0;

  const setField = (field) => (value) =>
    setSelection((prev) => ({ ...prev, [field]: value }));

  const showCut = shapeHasCutGrade(selection.shape);

  return (
    <div className={styles.wrap}>
      {/* ---------- 页头 ---------- */}
      <header className={styles.hero}>
        <div className={styles.heroInner}>
          <span className={styles.kicker}>
            {T("quote.kicker", "Ring Calculator")}
          </span>
          <h1 className={styles.h1}>
            {T("quote.heading", "Design & Price Your Ring")}
          </h1>
          <p className={styles.heroText}>
            {T(
              "quote.intro",
              "Our settings are sold on their own so you can choose your centre diamond separately. Set the 4Cs below to see what that stone should cost, then add a setting for your full ring budget."
            )}
          </p>
        </div>
      </header>

      <div className={styles.layout}>
        {/* ---------- 左：选择器 ---------- */}
        <div className={styles.controls}>
          {/* 形状 */}
          <section className={styles.block} aria-labelledby="q-shape">
            <div className={styles.blockHead}>
              <h2 className={styles.blockTitle} id="q-shape">
                {T("quote.shape_title", "Diamond Shape")}
              </h2>
              <p className={styles.blockHint}>
                {T(
                  "quote.shape_hint",
                  "Round costs the most per carat — it loses the most rough in cutting. Fancy shapes give you more size for the same budget."
                )}
              </p>
            </div>
            <div className={styles.shapeGrid} role="radiogroup" aria-label="Diamond shape">
              {SHAPES.map((s) => {
                const active = selection.shape === s.slug;
                return (
                  <button
                    key={s.slug}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    className={`${styles.shapeTile} ${active ? styles.shapeTileActive : ""}`}
                    onClick={() => setField("shape")(s.slug)}
                  >
                    <img
                      className={styles.shapeImg}
                      src={`/diamond-shapes/${s.slug}.png`}
                      alt=""
                      width={72}
                      height={72}
                      loading="lazy"
                    />
                    <span className={styles.shapeLabel}>
                      {LANG[`home.shape_${s.slug}`] || s.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* 克拉 */}
          <section className={styles.block} aria-labelledby="q-carat">
            <div className={styles.blockHead}>
              <h2 className={styles.blockTitle} id="q-carat">
                {T("quote.carat_title", "Carat Weight")}
              </h2>
              <p className={styles.blockHint}>
                {T(
                  "quote.carat_hint",
                  "Price climbs faster than weight, and jumps at the round numbers — 0.90ct costs noticeably less than 1.00ct for a difference nobody can see."
                )}
              </p>
            </div>
            <div className={styles.chipRow} role="radiogroup" aria-label="Carat weight">
              {CARAT_OPTIONS.map((ct) => {
                const active = Number(selection.carat) === ct;
                return (
                  <button
                    key={ct}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    className={`${styles.chip} ${active ? styles.chipActive : ""}`}
                    onClick={() => setField("carat")(ct)}
                  >
                    {formatCarat(ct)}
                  </button>
                );
              })}
            </div>
          </section>

          {/* 颜色 */}
          <section className={styles.block} aria-labelledby="q-color">
            <div className={styles.blockHead}>
              <h2 className={styles.blockTitle} id="q-color">
                {T("quote.color_title", "Colour")}
              </h2>
              <p className={styles.blockHint}>
                {T(
                  "quote.color_hint",
                  "D–F are colourless, G–J near colourless. Once a stone is set in gold, most people cannot tell G from D — which is where the value sits."
                )}
              </p>
            </div>
            <div className={styles.chipRow} role="radiogroup" aria-label="Colour grade">
              {COLOR_OPTIONS.map((c) => {
                const active = selection.color === c.code;
                return (
                  <button
                    key={c.code}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    className={`${styles.chip} ${active ? styles.chipActive : ""}`}
                    onClick={() => setField("color")(c.code)}
                  >
                    {c.code}
                  </button>
                );
              })}
            </div>
          </section>

          {/* 净度 */}
          <section className={styles.block} aria-labelledby="q-clarity">
            <div className={styles.blockHead}>
              <h2 className={styles.blockTitle} id="q-clarity">
                {T("quote.clarity_title", "Clarity")}
              </h2>
              <p className={styles.blockHint}>
                {T(
                  "quote.clarity_hint",
                  "VS1 and above are eye-clean at arm's length. Paying up to FL buys a certificate, not a visible difference."
                )}
              </p>
            </div>
            <div className={styles.chipRow} role="radiogroup" aria-label="Clarity grade">
              {CLARITY_OPTIONS.map((c) => {
                const active = selection.clarity === c.code;
                return (
                  <button
                    key={c.code}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    className={`${styles.chip} ${active ? styles.chipActive : ""}`}
                    onClick={() => setField("clarity")(c.code)}
                  >
                    {c.label}
                  </button>
                );
              })}
            </div>
          </section>

          {/* 切工：仅圆形有权威切工等级 */}
          {showCut ? (
            <section className={styles.block} aria-labelledby="q-cut">
              <div className={styles.blockHead}>
                <h2 className={styles.blockTitle} id="q-cut">
                  {T("quote.cut_title", "Cut")}
                </h2>
                <p className={styles.blockHint}>
                  {T(
                    "quote.cut_hint",
                    "The one grade worth paying for — cut is what makes a diamond return light. We do not recommend going below Very Good."
                  )}
                </p>
              </div>
              <div className={styles.chipRow} role="radiogroup" aria-label="Cut grade">
                {CUT_OPTIONS.map((c) => {
                  const active = selection.cut === c.code;
                  return (
                    <button
                      key={c.code}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      className={`${styles.chip} ${active ? styles.chipActive : ""}`}
                      onClick={() => setField("cut")(c.code)}
                    >
                      {c.label}
                    </button>
                  );
                })}
              </div>
            </section>
          ) : (
            <section className={styles.block}>
              <div className={styles.blockHead}>
                <h2 className={styles.blockTitle}>{T("quote.cut_title", "Cut")}</h2>
                <p className={styles.blockHint}>
                  {T(
                    "quote.cut_na",
                    "IGI and GIA only issue an overall cut grade for round brilliants. Fancy shapes are graded on polish and symmetry instead, so cut is not priced in here."
                  )}
                </p>
              </div>
            </section>
          )}

          {/* 戒托（真实商品 + 真实价） */}
          {settings.length > 0 ? (
            <section className={styles.block} aria-labelledby="q-setting">
              <div className={styles.blockHead}>
                <h2 className={styles.blockTitle} id="q-setting">
                  {T("quote.setting_title", "Add a Setting")}
                  <span className={styles.optional}>
                    {T("quote.optional", "Optional")}
                  </span>
                </h2>
                <p className={styles.blockHint}>
                  {T(
                    "quote.setting_hint",
                    "Real prices from our collection, shown from the lowest metal and accent option. Your final setting price depends on the metal you choose."
                  )}
                </p>
              </div>
              <div className={styles.settingGrid}>
                {settings.map((s) => {
                  const active = settingKey === s.key;
                  const item = pricingMap?.[`${s.sort_key}:${s.key}`];
                  const ai = pricingReady ? pickLowestAreaInfo(item) : null;
                  const price = settingPriceInMajorUnit(ai);
                  return (
                    <button
                      key={s.key}
                      type="button"
                      aria-pressed={active}
                      className={`${styles.settingCard} ${active ? styles.settingCardActive : ""}`}
                      onClick={() => setSettingKey(active ? null : s.key)}
                    >
                      <span className={styles.settingThumb}>
                        {s.image ? (
                          <img src={fillOssImage(s.image)} alt="" loading="lazy" />
                        ) : (
                          <span className={styles.settingThumbEmpty} aria-hidden="true" />
                        )}
                      </span>
                      <span className={styles.settingBody}>
                        <span className={styles.settingName}>{s.name}</span>
                        <span className={styles.settingPrice}>
                          {!pricingReady ? (
                            <Skeleton variant="rect" width={64} height={14} />
                          ) : price > 0 ? (
                            <>
                              <span className={styles.fromWord}>
                                {T("quote.from", "from")}
                              </span>{" "}
                              {money(price)}
                            </>
                          ) : (
                            T("quote.price_unavailable", "Price on request")
                          )}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>
          ) : null}
        </div>

        {/* ---------- 右：汇总（桌面粘性） ---------- */}
        <aside className={styles.summaryCol}>
          <div className={styles.summary}>
            <h2 className={styles.sumTitle}>
              {T("quote.summary_title", "Your Estimate")}
            </h2>

            <dl className={styles.sumSpecs}>
              <div className={styles.sumSpecRow}>
                <dt>{T("quote.summary_stone", "Centre diamond")}</dt>
                <dd>
                  {formatCarat(selection.carat)}ct{" "}
                  {LANG[`home.shape_${selection.shape}`] || shapeLabel(selection.shape)}
                  {" · "}
                  {selection.color}/{selection.clarity}
                  {showCut ? ` · ${
                    CUT_OPTIONS.find((c) => c.code === selection.cut)?.label || ""
                  }` : ""}
                </dd>
              </div>
              {selectedSetting ? (
                <div className={styles.sumSpecRow}>
                  <dt>{T("quote.summary_setting", "Setting")}</dt>
                  <dd>{selectedSetting.name}</dd>
                </div>
              ) : null}
            </dl>

            <div className={styles.sumLines}>
              <div className={styles.sumLine}>
                <span>{T("quote.line_stone", "Centre diamond (est.)")}</span>
                <span className={styles.sumLineVal}>
                  {diamond.valid ? money(diamond.estimate) : "—"}
                </span>
              </div>
              {selectedSetting ? (
                <div className={styles.sumLine}>
                  <span>{T("quote.line_setting", "Setting (from)")}</span>
                  <span className={styles.sumLineVal}>
                    {!pricingReady ? (
                      <Skeleton variant="rect" width={60} height={14} />
                    ) : settingPrice > 0 ? (
                      money(settingPrice)
                    ) : (
                      T("quote.price_unavailable", "Price on request")
                    )}
                  </span>
                </div>
              ) : null}
            </div>

            <div className={styles.sumTotal}>
              <span className={styles.sumTotalLabel}>
                {selectedSetting
                  ? T("quote.total_ring", "Estimated ring total")
                  : T("quote.total_stone", "Estimated stone cost")}
              </span>
              <strong className={styles.sumTotalVal}>
                {diamond.valid ? money(total) : "—"}
              </strong>
              {diamond.valid ? (
                <span className={styles.sumRange}>
                  {T("quote.range", "Typical range")} {money(totalLow)} – {money(totalHigh)}
                </span>
              ) : null}
            </div>

            {/* 免责：这是行情估价而非报价，必须说清楚 */}
            <p className={styles.disclaimer}>
              {T(
                "quote.disclaimer",
                "Centre diamond figures are market estimates for lab-grown stones, not a quote — actual price depends on the individual stone and its certificate."
              )}
              {!usdBasis
                ? ` ${T("quote.usd_basis", "Diamond estimates are USD-based.")}`
                : ""}
            </p>

            <div className={styles.ctas}>
              <Link href="/support/contact" className={styles.ctaPrimary}>
                {T("quote.cta_consult", "Talk to a Diamond Specialist")}
              </Link>
              {selectedSetting ? (
                <Link
                  href={`/product/${selectedSetting.sort_key}/${selectedSetting.key}`}
                  className={styles.ctaSecondary}
                >
                  {T("quote.cta_view_setting", "View This Setting")}
                </Link>
              ) : (
                <Link href="/product/engagement-rings" className={styles.ctaSecondary}>
                  {T("quote.cta_browse", "Browse Settings")}
                </Link>
              )}
            </div>

            {/* 表的出处说明。措辞刻意强调「这张表的基准」而不是「你这颗石头的基准」：
                早先写成 "Estimates based on 1.00ct G/VS1 market pricing" 时，
                顾客选了 1.50ct 却在估价下方看到 "based on 1.00ct"，会读成
                「拿 1ct 的价糊弄我 1.5ct」。改为 benchmark/calibrated 表述后
                语义变成「价目表以 1ct 为标定锚点」，与实际口径一致。 */}
            <p className={styles.basisNote}>
              {T(
                "quote.basis_prefix",
                "Pricing calibrated to a lab-grown benchmark of"
              )}{" "}
              {formatCarat(PRICE_BASIS.anchor.carat)}ct {PRICE_BASIS.anchor.color}/
              {PRICE_BASIS.anchor.clarity}
              {T("quote.basis_suffix", ", revised")} {PRICE_BASIS.revisedAt}.
            </p>
          </div>
        </aside>
      </div>

      {/* ---------- FAQ ----------
          🔴 这三条问答同时被 QuoteLdJson 输出为 FAQPage 结构化数据。
          Google 要求 FAQ schema 的内容在页面上真实可见，故此处必须渲染，
          且文案需与 QuoteLdJson 里的 faqs 保持同义 —— 改一处要改两处。 */}
      <section className={styles.faq} aria-labelledby="q-faq">
        <div className={styles.faqInner}>
          <h2 className={styles.faqTitle} id="q-faq">
            {T("quote.faq_title", "Questions About Pricing")}
          </h2>
          <dl className={styles.faqList}>
            <div className={styles.faqItem}>
              <dt className={styles.faqQ}>
                {T("quote.faq_q1", "Does the setting price include the centre diamond?")}
              </dt>
              <dd className={styles.faqA}>
                {T(
                  "quote.faq_a1",
                  "No. Our settings are sold on their own so you can choose your centre diamond separately. The carat weight listed on a setting is the total weight of its accent diamonds, not the centre stone."
                )}
              </dd>
            </div>
            <div className={styles.faqItem}>
              <dt className={styles.faqQ}>
                {T(
                  "quote.faq_q2",
                  "Why does a round diamond cost more than a fancy shape?"
                )}
              </dt>
              <dd className={styles.faqA}>
                {T(
                  "quote.faq_a2",
                  "A round brilliant loses more of the rough stone during cutting than shapes like oval, emerald or princess. At the same carat weight and grades, a fancy shape is typically less expensive, which is why it gives you more visible size for the same budget."
                )}
              </dd>
            </div>
            <div className={styles.faqItem}>
              <dt className={styles.faqQ}>
                {T("quote.faq_q3", "Is this estimate a final quote?")}
              </dt>
              <dd className={styles.faqA}>
                {T(
                  "quote.faq_a3",
                  "No. Centre diamond figures are market estimates for lab-grown stones and will vary with the individual stone and its grading report. Setting prices shown are our real current prices. Contact a specialist for a firm quote on a specific stone."
                )}
              </dd>
            </div>
          </dl>
        </div>
      </section>
    </div>
  );
}
