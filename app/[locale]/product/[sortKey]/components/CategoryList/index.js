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

export default function CategoryList({
  category,
  goodList,
  categories = [],
  sortKey,
  LANG,
  goodDiscountFestival,
}) {
  // 首屏用默认地区，避免 SSR / 客户端首帧 hydration 不一致；mount 后切到真实 area。
  const [area, setArea] = React.useState(DEFAULT_AREA);
  React.useEffect(() => {
    const real = Cookies.get("area") || DEFAULT_AREA;
    if (real !== area) setArea(real);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className={styles.container}>
      {/* 面包屑 */}
      <nav className={styles.breadcrumb} aria-label="breadcrumb">
        <Link href="/">{LANG?.["common.nav.home"] ?? "Home"}</Link>
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
          {LANG?.["store.product_category.products"] ??
            (goodList.length === 1 ? "product" : "products")}
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

      {/* 商品网格 */}
      <section className={styles.goods_container}>
        {goodList.map((product) => (
          <ProductCard
            key={product.key}
            product={product}
            LANG={LANG}
            goodDiscountFestival={goodDiscountFestival}
            area={area}
          />
        ))}
      </section>
    </div>
  );
}
