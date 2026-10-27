/**
 * BestSellersModule — 首页热卖位（横向滑动商品卡）。
 *
 * 数据: context 的 bestSellers —— 由 page.jsx 调 /config/getTagProducts 按后台
 *   「best-sellers」标签取 Top 10。运营在 ERP 给商品打/去掉该标签即可换位，不需要发版
 *   （改完去发布页点发布重建）。标签不存在或该标签下无上架商品 → 空数组 → 整块不渲染。
 *
 * 价格: 与 IndexProductList 同口径——SSG 阶段不落价，客户端按 area cookie 调
 *   /api/products-offer 批量取「价格 + 自动折扣」，未就绪显示骨架、无价显示缺货文案。
 *
 * 视觉: 排名角标 #1..#10、命中折扣显示 Sale 标签 + 折后价划线原价。
 */
"use client";
import React from "react";
import Link from "next/link";
import styles from "./index.module.scss";
import { HomeContent } from "../IndexContext";
import { fillOssImage } from "@/utils";
import { StarIcon, StarActiveIcon } from "@/components/Icon";
import ProductCardPrice from "@/components/ProductCardPrice";
import Skeleton from "@/components/Skeleton";
import useArea from "@/hooks/useArea";
import getProductsOffer from "@/service/product/get-offer";
import { savedUnitAmount, pickAutoDiscount } from "@/utils/productPricing";

// 低饱和 tonal 占位主题(无图时用),与 BlogModule 同色系。
const TINTS = [
  "linear-gradient(150deg,#e9ede8 0%,#d5ded4 100%)",
  "linear-gradient(150deg,#f2ebdd 0%,#e6d8bf 100%)",
  "linear-gradient(150deg,#eeeae6 0%,#ddd6cd 100%)",
];

// 从批量取价结果挑出当前商品的 areaInfo：取首个有 areaInfo 的 combo（与 IndexProductList 一致）。
function pickAreaInfo(pricingItem) {
  if (!pricingItem) return null;
  const combos = Array.isArray(pricingItem.combos) ? pricingItem.combos : [];
  for (const c of combos) {
    if (c?.areaInfo) return c.areaInfo;
  }
  return null;
}

// 5 星评分(复刻 IndexProductList 的星条覆盖法,90px 满宽)。
function ReviewRate({ score, num, LANG }) {
  const label = LANG?.["home.reviews"] ? LANG["home.reviews"].replace("${num}", num) : `${num}`;
  return (
    <div className={styles.stars}>
      <div className={styles.starsBase}>
        <StarIcon /><StarIcon /><StarIcon /><StarIcon /><StarIcon />
      </div>
      <div className={styles.starsActive} style={{ width: 78 * (score / 5) }}>
        <StarActiveIcon /><StarActiveIcon /><StarActiveIcon /><StarActiveIcon /><StarActiveIcon />
      </div>
      <span className={styles.score}>({label})</span>
    </div>
  );
}

export default function BestSellersModule() {
  const { LANG, bestSellers, bestSellersTag, locale } =
    React.useContext(HomeContent) || {};
  const { area, areaReady } = useArea();
  const scrollerRef = React.useRef(null);
  const [atStart, setAtStart] = React.useState(true);
  const [atEnd, setAtEnd] = React.useState(false);

  const list = React.useMemo(
    () => (Array.isArray(bestSellers) ? bestSellers : []).slice(0, 10),
    [bestSellers]
  );

  // 批量取价入参：该位全部 (sortKey, productKey)。
  const allKeys = React.useMemo(
    () =>
      list
        .filter((p) => p.sort_key && p.key)
        .map((p) => ({ sortKey: p.sort_key, productKey: p.key })),
    [list]
  );

  // pricingMap: { "{sortKey}:{productKey}": item } —— null 表示未就绪（显示骨架）。
  const [pricingMap, setPricingMap] = React.useState(null);
  const [discountMap, setDiscountMap] = React.useState({});

  React.useEffect(() => {
    if (!areaReady || allKeys.length === 0) return;
    let cancelled = false;
    getProductsOffer({ area: area || "us", locale, keys: allKeys }).then((data) => {
      if (cancelled) return;
      const pMap = {};
      const dMap = {};
      (data?.list || []).forEach((item) => {
        pMap[`${item.sortKey}:${item.productKey}`] = item;
        if (item.discount) dMap[item.productKey] = item.discount;
      });
      setPricingMap(pMap);
      setDiscountMap(dMap);
    });
    return () => {
      cancelled = true;
    };
  }, [areaReady, area, locale, allKeys]);

  const pricingReady = pricingMap !== null;

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
  }, [updateEdges, list.length]);

  // 后台没建 best-sellers 标签 / 标签下没上架商品 → 整块不渲染（不留空白区块）。
  // 只打了 1 个也照常展示：卡片定宽左对齐，单卡布局正常，运营打了标签就该看见。
  if (list.length === 0) return null;

  const scrollBy = (dir) => {
    const el = scrollerRef.current;
    if (!el) return;
    const first = el.querySelector(`.${styles.card}`);
    let step = el.clientWidth * 0.85;
    if (first) {
      const gap = parseFloat(getComputedStyle(el).columnGap || getComputedStyle(el).gap) || 0;
      step = first.getBoundingClientRect().width + gap;
    }
    el.scrollBy({ left: dir * step, behavior: "smooth" });
  };

  return (
    <section className={styles.module} aria-label="Best Sellers">
      <div className={styles.inner}>
        <div className={styles.head}>
          <div className={styles.headText}>
            <span className={styles.kicker}>{LANG?.["home.bestsellers.kicker"] || "Most Loved"}</span>
            <h2 className={styles.title}>
              {LANG?.["home.bestsellers.title"] || bestSellersTag?.name || "Best Sellers"}
            </h2>
            <p className={styles.subtitle}>
              {LANG?.["home.bestsellers.subtitle"] || "The products our customers can't stop talking about."}
            </p>
          </div>
        </div>
      </div>

      <div className={styles.carousel}>
        <div className={styles.scroller} ref={scrollerRef}>
          {list.map((p, i) => {
            const img = p.image ? fillOssImage(p.image) : null;
            const areaInfo = pricingReady
              ? pickAreaInfo(pricingMap?.[`${p.sort_key}:${p.key}`])
              : null;
            // 命中自动折扣（限时促销）→ Sale 角标 + 折后价 + 划线原价。
            const autoDiscount = pickAutoDiscount(p, discountMap);
            const savedAmount = autoDiscount ? savedUnitAmount(areaInfo, autoDiscount) : 0;
            const onSale = savedAmount > 0;
            // 评分：后端已按「有真实评价按评价算，否则取商品表存量分」算好 reviewScore/reviewsNum。
            const score = Number(p.reviewScore || p.reviews_score || 0);
            const reviewsNum = Number(p.reviewsNum || p.reviews_num || 0);
            return (
              <Link
                key={p.key || i}
                href={`/product/${p.sort_key}/${p.key}`}
                className={styles.card}
                data-event="HomeBestSeller"
                data-ev-product={p.key}
              >
                <div
                  className={styles.thumb}
                  style={img ? undefined : { backgroundImage: TINTS[i % TINTS.length] }}
                >
                  <span className={styles.rank}>{i + 1}</span>
                  {onSale ? <span className={styles.saleTag}>Sale</span> : null}
                  {img ? (
                    <img src={img} alt={p.name} loading="lazy" />
                  ) : (
                    <span className={styles.placeholderMark} aria-hidden="true" />
                  )}
                </div>
                <div className={styles.body}>
                  {score ? (
                    <ReviewRate score={score} num={reviewsNum} LANG={LANG} />
                  ) : null}
                  <h3 className={styles.name}>{p.name}</h3>
                  {/* 价格：未就绪骨架 → 无价缺货 → 有价按折扣渲染（与 IndexProductList 同口径） */}
                  {!pricingReady ? (
                    <div className={styles.priceRow}>
                      <Skeleton variant="rect" width={80} height={16} />
                    </div>
                  ) : !areaInfo?.product_price ? (
                    <div className={styles.priceRow}>
                      {LANG?.["home.no_stock"] || ""}
                    </div>
                  ) : (
                    <ProductCardPrice
                      className={styles.priceRow}
                      areaInfo={areaInfo}
                      discount={onSale ? autoDiscount : null}
                      LANG={LANG}
                    />
                  )}
                </div>
              </Link>
            );
          })}
        </div>

        {!atEnd ? (
          <button type="button" className={`${styles.arrow} ${styles.next}`} aria-label="Next products" onClick={() => scrollBy(1)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 6l6 6-6 6" />
            </svg>
          </button>
        ) : null}
        {!atStart ? (
          <button type="button" className={`${styles.arrow} ${styles.prev}`} aria-label="Previous products" onClick={() => scrollBy(-1)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 6l-6 6 6 6" />
            </svg>
          </button>
        ) : null}
      </div>
    </section>
  );
}
