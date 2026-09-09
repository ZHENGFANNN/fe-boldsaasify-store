/** @format */
"use client";

/**
 * QuoteTeaserModule —— 首页「估价器」入口位，把顾客导向 /quote。
 *
 * 为什么首页需要这一块：本站**只卖戒托**，商详页明写中心石
 * "priced and selected on its own"。顾客在首页看完商品后最直接的问题是
 * 「那颗石头到底要多少钱」，此前站上没有任何地方回答，只能跳出去比价。
 * 这一块的职责就是把那个问题接住，并给出「按我的尺寸直接进去」的入口。
 *
 * 刻意**不在本块显示任何价格**：
 *   1) 估价器给的是区间（low–high），在首页压成一个「from $X」是把诚实的区间
 *      伪装成确定价；高客单价场景下这种精度错觉比不给数字更伤信任。
 *   2) 中心石表以 USD 编制，估价器内部带 USD 基准注释；把数字搬到首页就得在每个
 *      chip 上正确复制那条注释，否则非 USD 站点会显示无标注的错币种金额。
 *      本站历史上正好踩过币种类的事故（currency_unit 被种成 0 → 整单 $0.00）。
 *   故 chip 只承担「带着克拉数跳进估价器」，价格一律由 /quote 现算现给。
 *
 * 纯静态可 SSG：克拉档位来自 @/config/diamondPricing 的 CARAT_OPTIONS（构建期常量），
 * 无数据依赖、无取价请求。文案走 home.quote.* i18n，带英文 fallback（本站目前单语 en）。
 *
 * chip 的 ?carat= 与 CTA 的落点都指向 /quote：
 *   href 刻意不带 locale 前缀 —— 全站惯例（Nav / BlogModule / FeatureShowcase 皆然），
 *   locale 段由 middleware 补，写成 /en/quote 反而会在其他语言下错位。
 */
import React from "react";
import Link from "next/link";
import { CARAT_OPTIONS } from "@/config/diamondPricing";
import styles from "./index.module.scss";

// 首页只放 4 个「整数关口」档位，不是把 CARAT_OPTIONS 全列出来（表里有 14 档，
// 全铺会变成又一个密集网格，和上方 Shop by Shape 的视觉职责撞车）。
// 这 4 个值必须存在于 CARAT_OPTIONS，否则 /quote 会拒绝该 query 并静默回落到
// 默认 1.0ct —— 下面 filter 就是这道保险：表里没有的档位直接不渲染，
// 而不是渲染一个点进去无效的 chip。
const FEATURED_CARATS = [0.5, 1.0, 1.5, 2.0].filter((ct) =>
  CARAT_OPTIONS.includes(ct)
);

// 估价器覆盖的 4C 维度，用于「这个工具算什么」的说明行。
const DIMENSIONS = ["Shape", "Carat", "Colour", "Clarity", "Cut"];

// chip 上的克拉写法刻意用短式（0.5 / 1 / 1.5 / 2）而不是 diamondPricing 的
// formatCarat（返回 "1.00"）：后者是规格行的精度写法，放在首页快捷入口上读着像
// 实验室报告。行业惯例（Brilliant Earth / Blue Nile 的快捷筛选）也是短式。
// String(ct) 对这四个值都给出想要的结果（0.5→"0.5"、1→"1"、1.5→"1.5"、2→"2"），
// href 里的模板字符串同理，Number() 回来仍精确命中 CARAT_OPTIONS。

export default function QuoteTeaserModule({ LANG = {} }) {
  const T = (key, fallback) => LANG?.[key] || fallback;

  const title = T("home.quote.title", "What Will Your Centre Diamond Cost?");

  return (
    <section className={styles.module} aria-label={title}>
      <div className={styles.inner}>
        <div className={styles.card}>
          <div className={styles.text}>
            <span className={styles.kicker}>
              {T("home.quote.kicker", "Price Estimator")}
            </span>
            <h2 className={styles.title}>{title}</h2>
            <p className={styles.desc}>
              {T(
                "home.quote.desc",
                "Our settings are sold on their own, so you choose the centre stone. Set the shape, carat, colour, clarity and cut — see an instant estimate, then add a real setting price for a complete ring budget."
              )}
            </p>

            <ul className={styles.dims} aria-hidden="true">
              {DIMENSIONS.map((d) => (
                <li key={d} className={styles.dim}>
                  {d}
                </li>
              ))}
            </ul>

            {/* 克拉快捷入口：带 ?carat= 直接落到估价器对应档位 */}
            {FEATURED_CARATS.length ? (
              <div className={styles.quick}>
                <span className={styles.quickLabel}>
                  {T("home.quote.quick_label", "Start from")}
                </span>
                <div className={styles.chips}>
                  {FEATURED_CARATS.map((ct) => (
                    <Link
                      key={ct}
                      href={`/quote?carat=${ct}`}
                      className={styles.chip}
                      data-event="HomeQuoteCarat"
                      aria-label={`${String(ct)} carat centre diamond estimate`}
                    >
                      {String(ct)} ct
                    </Link>
                  ))}
                </div>
              </div>
            ) : null}

            <div className={styles.actions}>
              <Link
                href="/quote"
                className={styles.cta}
                data-event="HomeQuoteCta"
              >
                <span>{T("home.quote.cta", "Design & Price Your Ring")}</span>
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </Link>
              <span className={styles.note}>
                {T("home.quote.note", "Free · instant · no email required")}
              </span>
            </div>
          </div>

          {/* 装饰面：圆明亮式钻石**侧剖轮廓**，纯 SVG（不引图，零请求、不受 R2 缓存影响）。
              画的是真实切工剖面而不是扑克牌那种上下都尖的菱形：
                顶面平台(table) → 冠部外扩到腰围(girdle，最宽处，约 1/4 高度)
                → 亭部收到底尖(culet)。
              上下都画尖会变成风筝形，在一个讲 4C 的板块旁边等于自曝不懂钻石。 */}
          <div className={styles.visual} aria-hidden="true">
            <svg
              className={styles.diamond}
              viewBox="0 0 200 200"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
              strokeLinejoin="round"
            >
              {/* 外轮廓：table → 腰围 → 底尖 */}
              <path d="M70 52 L130 52 L172 84 L100 176 L28 84 Z" />
              {/* 腰围线 */}
              <path d="M28 84 H172" />
              {/* 冠部刻面 */}
              <path d="M70 52 L52 84" />
              <path d="M130 52 L148 84" />
              {/* 亭部刻面收向底尖 */}
              <path d="M52 84 L100 176" />
              <path d="M100 84 L100 176" />
              <path d="M148 84 L100 176" />
            </svg>
          </div>
        </div>
      </div>
    </section>
  );
}
