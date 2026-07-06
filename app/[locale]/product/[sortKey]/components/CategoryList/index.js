/** @format */

"use client";

import React from "react";
import Link from "next/link";

import { formatCurrency, fillOssImage } from "@/utils";
import {
  discountedUnitPrice,
  savedUnitAmount,
  pickAutoDiscount,
  formatDiscountLabel,
} from "@/utils/productPricing";
import useArea from "@/hooks/useArea";
import Skeleton from "@/components/Skeleton";
import WishlistButton from "@/components/WishlistButton";
import getProductsPricing from "@/service/product/get-products-pricing";
import getProductDiscounts from "@/service/product/get-product-discounts";
import styles from "./index.module.scss";

const active_icon = `${process.env.NEXT_PUBLIC_FILE}/common/image/icon/previews_stars_active_icon.svg`;
const no_active_icon = `${process.env.NEXT_PUBLIC_FILE}/common/image/icon/previews_stars_icon.svg`;

// 从批量取价结果挑出当前商品的 areaInfo：取首个有 areaInfo 的 combo（与原 resolveAreaInfo 行为对齐）。
function pickAreaInfo(pricingItem) {
  if (!pricingItem) return null;
  const combos = Array.isArray(pricingItem.combos) ? pricingItem.combos : [];
  for (const c of combos) {
    if (c?.areaInfo) return c.areaInfo;
  }
  return null;
}

function ReviewRate({ LANG, reviewScore, reviewsNum }) {
  if (!reviewScore) return null;
  return (
    <div className={styles.stars_container}>
      <div className={styles.no_active_stars}>
        {Array.from({ length: 5 }).map((_, i) => (
          <img alt="star" src={no_active_icon} key={i} />
        ))}
      </div>
      <div className={styles.active_stars} style={{ width: 90 * (reviewScore / 5) }}>
        {Array.from({ length: 5 }).map((_, i) => (
          <img alt="star" src={active_icon} key={i} />
        ))}
      </div>
      <div className={styles.score}>
        {`( ${LANG?.["store.index.reviews"]?.replace("${num}", reviewsNum) ?? reviewsNum} )`}
      </div>
    </div>
  );
}

// 取商品当前地区的展示价（用于价格区间筛选）；pricing 未就绪 / 无价时返回 null。
function getDisplayPrice(product, pricingMap) {
  const item = pricingMap?.[`${product.sort_key}:${product.key}`];
  const areaInfo = pickAreaInfo(item);
  if (!areaInfo) return null;
  const raw = areaInfo.product_price;
  if (raw == null) return null;
  // product_price 是「分」级整数，currency_unit 为换算基数(如 100)。
  const unit = areaInfo.currency_unit || 100;
  return raw / unit;
}

const PAGE_SIZE = 10;

// 两位补零
function pad2(n) {
  return Math.max(0, n).toString().padStart(2, "0");
}

// 列表卡片限时倒计时：自管 setInterval（不依赖 jQuery），ends_at 为毫秒戳。
// 过期后自动隐藏（剩余 ≤ 0 时返回 null）。
function CardCountdown({ endsAt }) {
  // 初始 0：挂载后由 effect 立即算出真实剩余（避免在 render 内调用 Date.now 这类非纯函数）。
  const [remain, setRemain] = React.useState(0);
  React.useEffect(() => {
    const tick = () => setRemain(Math.max(0, Number(endsAt) - Date.now()));
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [endsAt]);
  if (remain <= 0) return null;
  const seconds = Math.floor(remain / 1000);
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return (
    <div className={styles.discount_countdown}>
      <span>{pad2(hours)}</span>
      <i>:</i>
      <span>{pad2(minutes)}</span>
      <i>:</i>
      <span>{pad2(secs)}</span>
    </div>
  );
}

function ProductCard({ product, LANG, pricingMap, pricingReady, discountMap }) {
  const areaInfo = pricingReady
    ? pickAreaInfo(pricingMap?.[`${product.sort_key}:${product.key}`])
    : null;
  // 命中自动规则折扣：驱动"折后价 + 划线原价 + Saved"渲染，同时保留限时倒计时标签。
  const autoDiscount = pickAutoDiscount(product, discountMap);
  const savedAmount = autoDiscount ? savedUnitAmount(areaInfo, autoDiscount) : 0;
  const discountedPrice = autoDiscount
    ? discountedUnitPrice(areaInfo, autoDiscount)
    : areaInfo?.product_price;
  return (
    <Link
      scroll={true}
      href={`/product/${product.sort_key}/${product.key}`}
      className={styles.goods_item}
    >
      <div className={styles.image_container} data-scenes={!!product.image_scenes}>
        <WishlistButton
          className={styles.wishlist_btn}
          sortKey={product.sort_key}
          productKey={product.key}
          LANG={LANG}
        />
        <img
          className={styles.product_image}
          alt={product.name}
          src={fillOssImage(product.image)}
        />
        {product.image_scenes ? (
          <img
            className={styles.scenes_image}
            alt={product.name}
            src={fillOssImage(product.image_scenes)}
          />
        ) : null}
        {/* 限时折扣标签 + 倒计时：命中自动规则折扣且未过期时展示 */}
        {autoDiscount ? (
          <div className={styles.limit_discount_tag}>
            <span className={styles.limit_discount_label}>
              {formatDiscountLabel(autoDiscount, areaInfo, LANG)}
            </span>
            <CardCountdown endsAt={Number(autoDiscount.ends_at)} />
          </div>
        ) : null}
      </div>
      <div className={styles.content_container}>
        <ReviewRate
          LANG={LANG}
          reviewScore={product.reviewScore}
          reviewsNum={product.reviewsNum}
        />
        <h3 className={styles.product_name}>{product.name}</h3>
        {!pricingReady ? (
          <div className={styles.product_price_container}>
            <Skeleton variant="rect" width={80} height={16} />
          </div>
        ) : !areaInfo?.product_price ? (
          <div className={styles.product_stock_container}>
            {LANG?.["store.index.no_stock"] ?? "Out of stock"}
          </div>
        ) : autoDiscount && savedAmount > 0 ? (
          <>
            <div className={styles.product_price_container}>
              <div>{`${areaInfo?.currency_symbol}${formatCurrency(
                discountedPrice,
                areaInfo?.currency_unit
              )}`}</div>
              <div>{`${areaInfo?.currency_symbol}${formatCurrency(
                areaInfo?.product_price,
                areaInfo?.currency_unit
              )}`}</div>
            </div>
            <div className={styles.saved_tag}>
              {`${LANG?.["store.index.saved"] || "Saved"} ${areaInfo?.currency_symbol}${formatCurrency(
                savedAmount,
                areaInfo?.currency_unit
              )}`}
            </div>
          </>
        ) : (
          <div className={styles.product_price_container}>
            <div>{`${areaInfo?.currency_symbol}${formatCurrency(
              areaInfo?.product_price,
              areaInfo?.currency_unit
            )}`}</div>
          </div>
        )}
      </div>
    </Link>
  );
}

// 把全部商品的商品标签聚合成去重列表（按字母序），用于渲染标签筛选项。
function buildTagList(goodList) {
  const set = new Set();
  goodList.forEach((p) => {
    (p.tags || []).forEach((tag) => {
      if (tag) set.add(tag);
    });
  });
  return Array.from(set).sort();
}

// t(key, fallback)：有文案用文案，没有回退英文，保证不依赖后端文案也能用。
function makeT(LANG) {
  return (key, fallback) => LANG?.[key] ?? fallback;
}

export default function CategoryList({
  category,
  goodList,
  categories = [],
  sortKey,
  locale,
  LANG,
  // goodDiscountFestival,
}) {
  const t = makeT(LANG);

  const { area, areaReady } = useArea();
  // pricingMap = null 代表未就绪（首屏 + 取价中）；获取后变 {key: pricingItem}。
  const [pricingMap, setPricingMap] = React.useState(null);
  const pricingReady = pricingMap !== null;
  // discountMap：按 product_key 索引的自动规则折扣（限时促销），未就绪为 {}。
  const [discountMap, setDiscountMap] = React.useState({});

  // 全部 (sortKey, productKey) 集合（一次批量取价的输入）。
  const allKeys = React.useMemo(
    () =>
      goodList
        .filter((p) => p.sort_key && p.key)
        .map((p) => ({ sortKey: p.sort_key, productKey: p.key })),
    [goodList]
  );

  React.useEffect(() => {
    if (!areaReady) return;
    let cancelled = false;
    const effectiveArea = area || "us";
    getProductsPricing({
      area: effectiveArea,
      locale,
      keys: allKeys,
    }).then((data) => {
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
  }, [areaReady, area, locale, allKeys]);

  // 并行批量取自动折扣（限时促销）：传当前 area + 全部商品 {product_key, sort_key}。
  // 与定价取价相互独立，互不阻塞；命中按 product_key 建 map 供卡片渲染。
  React.useEffect(() => {
    if (!areaReady) return;
    let cancelled = false;
    const effectiveArea = area || "us";
    getProductDiscounts({
      area_code: effectiveArea,
      product_list: allKeys.map((k) => ({
        product_key: k.productKey,
        sort_key: k.sortKey,
      })),
    }).then((res) => {
      if (cancelled) return;
      setDiscountMap(res?.map || {});
    });
    return () => {
      cancelled = true;
    };
  }, [areaReady, area, allKeys]);

  // 筛选状态：selectedTags = Set(已选商品标签)；价格区间字符串（受控输入）。
  const [selectedTags, setSelectedTags] = React.useState(() => new Set());
  const [minPrice, setMinPrice] = React.useState("");
  const [maxPrice, setMaxPrice] = React.useState("");
  const [visible, setVisible] = React.useState(PAGE_SIZE);

  const tagList = React.useMemo(() => buildTagList(goodList), [goodList]);
  const hasAnyFilter =
    selectedTags.size > 0 || minPrice !== "" || maxPrice !== "";

  // 筛选：商品标签按 OR 匹配（选中任一标签即命中）；价格按当前地区展示价落在 [min,max]。
  // pricing 未就绪时不启用筛选（保留首屏列表，避免没价时把所有商品过滤光）。
  const filtered = React.useMemo(() => {
    if (!pricingReady) return goodList;
    const min = minPrice === "" ? -Infinity : Number(minPrice);
    const max = maxPrice === "" ? Infinity : Number(maxPrice);
    return goodList.filter((p) => {
      if (selectedTags.size > 0) {
        const tags = p.tags || [];
        if (!tags.some((tg) => selectedTags.has(tg))) return false;
      }
      if (min !== -Infinity || max !== Infinity) {
        const price = getDisplayPrice(p, pricingMap);
        if (price == null) return false; // 设了价格区间但该商品无价 → 不展示
        if (price < min || price > max) return false;
      }
      return true;
    });
  }, [pricingReady, goodList, selectedTags, minPrice, maxPrice, pricingMap]);

  // 任一筛选条件变化时，分页重置回第一页。
  React.useEffect(() => {
    setVisible(PAGE_SIZE);
  }, [selectedTags, minPrice, maxPrice]);

  const shown = filtered.slice(0, visible);
  const hasMore = visible < filtered.length;

  const toggleTag = (tag) => {
    setSelectedTags((prev) => {
      const next = new Set(prev);
      if (next.has(tag)) next.delete(tag);
      else next.add(tag);
      return next;
    });
  };

  const clearFilters = () => {
    setSelectedTags(new Set());
    setMinPrice("");
    setMaxPrice("");
  };

  return (
    <div className={styles.container}>
      {/* 面包屑 */}
      <nav className={styles.breadcrumb} aria-label="breadcrumb">
        <Link href="/">{t("common.nav.home", "Home")}</Link>
        <span className={styles.sep}>/</span>
        <span className={styles.current}>{category.name}</span>
      </nav>

      {/* 分类标题 + 描述（左对齐，不显示商品数量） */}
      <header className={styles.collection_header}>
        <h1 className={styles.collection_title}>{category.name}</h1>
        {category.description ? (
          <p className={styles.collection_desc}>{category.description}</p>
        ) : null}
      </header>

      {/* 分类切换 chips */}
      {categories.length > 1 ? (
        <div className={styles.category_nav}>
          {categories.map((c) => (
            <Link
              key={c.key}
              href={`/product/${c.key}`}
              className={styles.category_chip}
              data-active={c.key === sortKey}
            >
              {c.name}
            </Link>
          ))}
        </div>
      ) : null}

      {/* 筛选区：纯客户端，pricing 就绪后渲染（SSR 不输出，避免影响首屏/SEO） */}
      {pricingReady ? (
        <div className={styles.filter_bar}>
          {/* 商品标签筛选 */}
          {tagList.length > 0 ? (
            <div className={styles.filter_group}>
              <div className={styles.filter_label}>
                {t("store.product_category.tags", "Tags")}
              </div>
              <div className={styles.filter_options}>
                {tagList.map((tag) => (
                  <button
                    type="button"
                    key={tag}
                    className={styles.filter_tag}
                    data-active={selectedTags.has(tag)}
                    onClick={() => toggleTag(tag)}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {/* 价格范围 */}
          <div className={styles.filter_group}>
            <div className={styles.filter_label}>
              {t("store.product_category.price", "Price")}
            </div>
            <div className={styles.price_range}>
              <input
                type="number"
                inputMode="numeric"
                min="0"
                className={styles.price_input}
                placeholder={t("store.product_category.min", "Min")}
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
              />
              <span className={styles.price_dash}>-</span>
              <input
                type="number"
                inputMode="numeric"
                min="0"
                className={styles.price_input}
                placeholder={t("store.product_category.max", "Max")}
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
              />
            </div>
          </div>

          {hasAnyFilter ? (
            <button
              type="button"
              className={styles.clear_btn}
              onClick={clearFilters}
            >
              {t("store.product_category.clear", "Clear all")}
            </button>
          ) : null}
        </div>
      ) : null}

      {/* 商品网格 / 空状态 */}
      {shown.length > 0 ? (
        <section className={styles.goods_container}>
          {shown.map((product) => (
            <ProductCard
              key={product.key}
              product={product}
              LANG={LANG}
              pricingMap={pricingMap}
              pricingReady={pricingReady}
              discountMap={discountMap}
            />
          ))}
        </section>
      ) : (
        <div className={styles.empty_state}>
          <div className={styles.empty_icon} aria-hidden="true">
            ✦
          </div>
          <div className={styles.empty_title}>
            {t("store.product_category.empty_title", "No products found")}
          </div>
          <div className={styles.empty_desc}>
            {t(
              "store.product_category.empty_desc",
              "Try adjusting or clearing your filters."
            )}
          </div>
          {hasAnyFilter ? (
            <button
              type="button"
              className={styles.empty_clear}
              onClick={clearFilters}
            >
              {t("store.product_category.clear", "Clear all")}
            </button>
          ) : null}
        </div>
      )}

      {/* 加载更多 / 已全部加载 */}
      {shown.length > 0 ? (
        <div className={styles.load_more_bar}>
          {hasMore ? (
            <button
              type="button"
              className={styles.load_more_btn}
              onClick={() => setVisible((v) => v + PAGE_SIZE)}
            >
              {t("store.product_category.load_more", "Load more")}
            </button>
          ) : pricingReady ? (
            <div className={styles.all_loaded}>
              {t("store.product_category.all_loaded", "All products loaded")}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
