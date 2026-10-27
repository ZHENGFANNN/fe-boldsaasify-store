/**
 * CategoryModule — Shop by Category（左对齐标题 + 横向滑动分类卡，原创实现）。
 *
 * 版式:
 *   - 左对齐大标题（serif）+ 副标题一行。
 *   - 一排横向可滑动的分类卡（scroll-snap），右侧圆形箭头翻页；到边隐藏对应箭头。
 *   - 卡片: 近方形图 + 标签在图下方左对齐。
 *
 * 数据源: HomeContent.categoryList ← /config/getSortList（直接读 erp_goods_sort 全量分类，
 *   不依赖商品是否上架、不在前端写死）。每项取 key/name/image_src。
 * 渲染条件: 分类数 >=2 才渲染（<2 时 return null，不留空标题）。
 * 配图: 有 image_src 用真实图；该分类未配图时用 CSS 渐变占位（配图后回填 image_src 即替换）。
 *
 * 🔴 文案兜底刻意保持「品类中立」: 本组件在 master 上被多个租户站共用（女包/音响/珠宝…），
 *   写死珠宝措辞会串到不相关的站。要品类专属文案就在后台配 home.category.title / .subtitle。
 */
"use client";
import React from "react";
import Link from "next/link";
import styles from "./index.module.scss";
import { HomeContent } from "../IndexContext";
import { fillOssImage } from "@/utils";

// 未配图分类的渐变占位色板（仅作占位，按序轮用；不代表任何具体分类）。
const TINTS = [
  "linear-gradient(135deg,#2f4f4a,#5b7a72)",
  "linear-gradient(135deg,#b8862f,#d8ad55)",
  "linear-gradient(135deg,#b6a888,#cbbb99)",
  "linear-gradient(135deg,#274a44,#3f6b62)",
  "linear-gradient(135deg,#b9a87f,#d0bd97)",
  "linear-gradient(135deg,#7a2b25,#a8433a)",
  "linear-gradient(135deg,#8a6a3a,#b08a4f)",
  "linear-gradient(135deg,#3a4a48,#5a6f6b)",
];

export default function CategoryModule() {
  const { categoryList, LANG } = React.useContext(HomeContent) || {};
  const scrollerRef = React.useRef(null);
  // 滚动到头/尾时隐藏对应箭头（起始态在最左 → 不显示左箭头）
  const [atStart, setAtStart] = React.useState(true);
  const [atEnd, setAtEnd] = React.useState(false);

  const raw = Array.isArray(categoryList) ? categoryList : [];
  const cats = raw.slice(0, 12).map((c, i) => ({
    key: c.key,
    name: c.name,
    image: c.image_src,
    scene: c.image_scenes,
    tint: TINTS[i % TINTS.length],
  }));

  const updateEdges = React.useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setAtStart(scrollLeft <= 1);
    setAtEnd(scrollLeft + clientWidth >= scrollWidth - 1);
  }, []);

  React.useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    updateEdges();
    el.addEventListener("scroll", updateEdges, { passive: true });
    window.addEventListener("resize", updateEdges);
    return () => {
      el.removeEventListener("scroll", updateEdges);
      window.removeEventListener("resize", updateEdges);
    };
  }, [updateEdges]);

  if (cats.length < 2) return null;

  const scrollBy = (dir) => {
    const el = scrollerRef.current;
    if (!el) return;
    // 每次滚动一张卡：按首张卡实际宽度 + gap 计算步长（不写死，跟随断点变化）
    const first = el.querySelector(`.${styles.card}`);
    let step = el.clientWidth * 0.85;
    if (first) {
      const gap = parseFloat(getComputedStyle(el).columnGap || getComputedStyle(el).gap) || 0;
      step = first.getBoundingClientRect().width + gap;
    }
    el.scrollBy({ left: dir * step, behavior: "smooth" });
  };

  return (
    <section
      className={styles.module}
      aria-label={LANG?.["home.category.title"] || "Shop by Category"}
    >
      <div className={styles.inner}>
        <div className={styles.head}>
          <h2 className={styles.title}>
            {LANG?.["home.category.title"] || "Shop by Category"}
          </h2>
          <p className={styles.subtitle}>
            {LANG?.["home.category.subtitle"] ||
              "Browse our collections."}
          </p>
        </div>
      </div>

      <div className={styles.carousel}>
        <div className={styles.scroller} ref={scrollerRef}>
          {cats.map((c) => {
            const img = c.image ? fillOssImage(c.image) : null;
            // 场景图与 cover 同名(R2 覆盖上传),CF 边缘 immutable 缓存旧图 → 附版本参数强制回源取新图。
            // 换新一批场景图时把 SCENE_VER 递增即可绕过边缘缓存。
            const scene = c.scene ? `${fillOssImage(c.scene)}?v=4` : null;
            return (
              <Link
                key={c.key}
                href={`/product/${c.key}`}
                className={styles.card}
                data-event="HomeCategory"
                data-ev-cat={c.key}
              >
                <div
                  className={styles.thumb}
                  style={img ? undefined : { backgroundImage: c.tint }}
                >
                  {img ? (
                    <img
                      className={styles.cover}
                      src={img}
                      alt={c.name}
                      loading="lazy"
                    />
                  ) : (
                    <span className={styles.placeholderMark} aria-hidden="true" />
                  )}
                  {/* 场景图（生活化实拍）：hover 时交叉淡入覆盖 cover；未配置则不渲染，hover 保持原缩放行为 */}
                  {scene ? (
                    <img
                      className={styles.scene}
                      src={scene}
                      alt=""
                      aria-hidden="true"
                      loading="lazy"
                    />
                  ) : null}
                </div>
                <span className={styles.name}>{c.name}</span>
              </Link>
            );
          })}
        </div>

        {!atEnd ? (
          <button
            type="button"
            className={`${styles.arrow} ${styles.next}`}
            aria-label="Next categories"
            onClick={() => scrollBy(1)}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 6l6 6-6 6" />
            </svg>
          </button>
        ) : null}
        {!atStart ? (
          <button
            type="button"
            className={`${styles.arrow} ${styles.prev}`}
            aria-label="Previous categories"
            onClick={() => scrollBy(-1)}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 6l-6 6 6 6" />
            </svg>
          </button>
        ) : null}
      </div>
    </section>
  );
}
