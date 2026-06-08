/** @format */

"use client";

import React from "react";
import Link from "next/link";
import Cookies from "js-cookie";

import { formatCurrency, fillOssImage } from "@/utils";
import styles from "./index.module.scss";

const active_icon = `${process.env.NEXT_PUBLIC_FILE}/common/image/icon/previews_stars_active_icon.svg`;
const no_active_icon = `${process.env.NEXT_PUBLIC_FILE}/common/image/icon/previews_stars_icon.svg`;

// 默认地区：SSR 用 us 渲染保证整页可静态化，mount 后读 area cookie 重算价格。
const DEFAULT_AREA = "us";

// 把单个商品的 comboList[].areaList 按地区解析成 areaInfo（取首个有该地区价的套餐）。
function resolveAreaInfo(comboList, area) {
  const list = Array.isArray(comboList) ? comboList : [];
  for (const combo of list) {
    const areaList = Array.isArray(combo?.areaList) ? combo.areaList : [];
    const hit = areaList.find((a) => a.country_code === area);
    if (hit) return hit;
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

// 取商品在当前地区的「展示价」(原价)，用于价格范围筛选；无价时返回 null。
function getDisplayPrice(product, area) {
  const areaInfo = resolveAreaInfo(product.comboList, area);
  if (!areaInfo) return null;
  const raw = areaInfo.selling_price ?? areaInfo.product_price;
  if (raw == null) return null;
  // selling_price/product_price 是「分」级整数，currency_unit 为换算基数(如 100)。
  const unit = areaInfo.currency_unit || 100;
  return raw / unit;
}

const PAGE_SIZE = 10;

function ProductCard({ product, LANG, goodDiscountFestival, area }) {
  const areaInfo = resolveAreaInfo(product.comboList, area);
  const discount = areaInfo?.product_discount;
  return (
    <Link
      scroll={true}
      href={`/product/${product.sort_key}/${product.key}`}
      className={styles.goods_item}
    >
      <div className={styles.image_container} data-scenes={!!product.image_scenes}>
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
      </div>
      <div className={styles.content_container}>
        <ReviewRate
          LANG={LANG}
          reviewScore={product.reviewScore}
          reviewsNum={product.reviewsNum}
        />
        <h3 className={styles.product_name}>{product.name}</h3>
        {goodDiscountFestival && discount ? (
          <div className={styles.good_discount_container}>
            <div className={styles.off}>{LANG?.["store.index.off"] ?? "OFF"}</div>
            <div className={styles.discount}>{100 - discount}%</div>
          </div>
        ) : null}
        {!areaInfo?.selling_price ? (
          <div className={styles.product_stock_container}>
            {LANG?.["store.index.no_stock"] ?? "Out of stock"}
          </div>
        ) : (
          <div className={styles.product_price_container}>
            {goodDiscountFestival && discount ? (
              <div>{`${areaInfo?.currency_symbol}${formatCurrency(
                areaInfo?.selling_price,
                areaInfo?.currency_unit
              )}`}</div>
            ) : null}
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

// 把全部商品的 tags 聚合成 { 维度: [取值,...] }，用于渲染筛选项（按维度分组）。
function buildTagGroups(goodList) {
  const groups = {};
  goodList.forEach((p) => {
    (p.tags || []).forEach(({ dim, value }) => {
      if (!dim || !value) return;
      (groups[dim] ||= new Set()).add(value);
    });
  });
  return Object.keys(groups).map((dim) => ({
    dim,
    values: Array.from(groups[dim]).sort(),
  }));
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
  LANG,
  goodDiscountFestival,
}) {
  const t = makeT(LANG);

  // 首屏用默认地区，避免 SSR / 客户端首帧 hydration 不一致；mount 后切到真实 area。
  const [area, setArea] = React.useState(DEFAULT_AREA);
  // mounted：SSR 与首帧只渲染前 PAGE_SIZE 条且不带筛选，保证「构建期/首屏有内容」、
  // 且 hydration 一致；mount 后才启用筛选 UI 与分页交互。
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setArea(Cookies.get("area") || DEFAULT_AREA);
    setMounted(true);
  }, []);

  // 筛选状态：selectedTags = { 维度: Set(取值) }；价格区间字符串（受控输入）。
  const [selectedTags, setSelectedTags] = React.useState({});
  const [minPrice, setMinPrice] = React.useState("");
  const [maxPrice, setMaxPrice] = React.useState("");
  const [visible, setVisible] = React.useState(PAGE_SIZE);

  const tagGroups = React.useMemo(() => buildTagGroups(goodList), [goodList]);
  const hasAnyFilter =
    Object.values(selectedTags).some((s) => s && s.size > 0) ||
    minPrice !== "" ||
    maxPrice !== "";

  // 筛选：标签按「维度内 OR、维度间 AND」匹配；价格按当前地区展示价落在 [min,max]。
  const filtered = React.useMemo(() => {
    if (!mounted) return goodList; // 首屏不筛选
    const min = minPrice === "" ? -Infinity : Number(minPrice);
    const max = maxPrice === "" ? Infinity : Number(maxPrice);
    return goodList.filter((p) => {
      for (const dim of Object.keys(selectedTags)) {
        const picked = selectedTags[dim];
        if (!picked || picked.size === 0) continue;
        const vals = (p.tags || [])
          .filter((tg) => tg.dim === dim)
          .map((tg) => tg.value);
        if (!vals.some((v) => picked.has(v))) return false;
      }
      if (min !== -Infinity || max !== Infinity) {
        const price = getDisplayPrice(p, area);
        if (price == null) return false; // 设了价格区间但该商品无价 → 不展示
        if (price < min || price > max) return false;
      }
      return true;
    });
  }, [mounted, goodList, selectedTags, minPrice, maxPrice, area]);

  // 任一筛选条件变化时，分页重置回第一页。
  React.useEffect(() => {
    setVisible(PAGE_SIZE);
  }, [selectedTags, minPrice, maxPrice]);

  const shown = filtered.slice(0, visible);
  const hasMore = visible < filtered.length;

  const toggleTag = (dim, value) => {
    setSelectedTags((prev) => {
      const next = { ...prev };
      const set = new Set(next[dim] || []);
      if (set.has(value)) set.delete(value);
      else set.add(value);
      next[dim] = set;
      return next;
    });
  };

  const clearFilters = () => {
    setSelectedTags({});
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

      {/* 分类标题 + 描述 */}
      <header className={styles.collection_header}>
        <h1 className={styles.collection_title}>{category.name}</h1>
        {category.description ? (
          <p className={styles.collection_desc}>{category.description}</p>
        ) : null}
        <div className={styles.count}>
          {goodList.length}{" "}
          {t(
            "store.product_category.products",
            goodList.length === 1 ? "product" : "products"
          )}
        </div>
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

      {/* 筛选区：纯客户端，mount 后渲染（SSR 不输出，避免影响首屏/SEO） */}
      {mounted ? (
        <div className={styles.filter_bar}>
          {tagGroups.map(({ dim, values }) => (
            <div className={styles.filter_group} key={dim}>
              <div className={styles.filter_label}>{dim}</div>
              <div className={styles.filter_options}>
                {values.map((v) => {
                  const active = selectedTags[dim]?.has(v);
                  return (
                    <button
                      type="button"
                      key={v}
                      className={styles.filter_tag}
                      data-active={!!active}
                      onClick={() => toggleTag(dim, v)}
                    >
                      {v}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

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
              goodDiscountFestival={goodDiscountFestival}
              area={area}
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
          ) : mounted ? (
            <div className={styles.all_loaded}>
              {t("store.product_category.all_loaded", "All products loaded")}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
