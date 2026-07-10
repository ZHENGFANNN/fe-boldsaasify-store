/** @format */

"use client";

import React from "react";
import styles from "./index.module.scss";
import Link from "next/link";
import { IndexContent } from "../IndexContext";

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
import getProductsOffer from "@/service/product/get-offer";

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

// 两位补零
function pad2(n) {
  return Math.max(0, n).toString().padStart(2, "0");
}

// 列表卡片限时倒计时：自管 setInterval（不依赖 jQuery），ends_at 为毫秒戳。
// 剩余 ≤ 0（含永不过期 ends_at=0）时返回 null，仅展示折扣标签、不展示倒计时。
function CardCountdown({ endsAt }) {
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

function ReviewRate({ LANG, reviewScore, reviewsNum }) {
  return (
    <div className={styles.stars_container}>
      <div className={styles.no_active_stars}>
        <img alt="no_active_icon" src={no_active_icon} />
        <img alt="no_active_icon" src={no_active_icon} />
        <img alt="no_active_icon" src={no_active_icon} />
        <img alt="no_active_icon" src={no_active_icon} />
        <img alt="no_active_icon" src={no_active_icon} />
      </div>
      <div
        className={styles.active_stars}
        style={{
          width: 90 * (reviewScore / 5)
        }}
      >
        <img alt="active_icon" src={active_icon} />
        <img alt="active_icon" src={active_icon} />
        <img alt="active_icon" src={active_icon} />
        <img alt="active_icon" src={active_icon} />
        <img alt="active_icon" src={active_icon} />
      </div>
      <div className={styles.score}>{`( ${LANG["store.index.reviews"]?.replace(
        "${num}",
        reviewsNum
      )} )`}</div>
    </div>
  );
}

function ProductItem({ goodList, LANG, pricingMap, pricingReady, discountMap }) {
  return (
    <section className={styles.goods_container}>
      {goodList.map((product, productIndex) => {
        const areaInfo = pricingReady
          ? pickAreaInfo(pricingMap?.[`${product.sort_key}:${product.key}`])
          : null;
        // 命中自动折扣（限时促销）→ 折后价 + 划线原价 + Saved + 限时标签/倒计时。
        const autoDiscount = pickAutoDiscount(product, discountMap);
        const savedAmount = autoDiscount
          ? savedUnitAmount(areaInfo, autoDiscount)
          : 0;
        const discountedPrice = autoDiscount
          ? discountedUnitPrice(areaInfo, autoDiscount)
          : areaInfo?.product_price;
        return (
          <Link
            key={productIndex}
            scroll={true}
            data-event="IndexProductItem"
            data-ev-product-name={product.key}
            href={`/product/${product.sort_key}/${product.key}`}
            className={styles.goods_item}
          >
            <div
              className={styles.image_container}
              data-scenes={!!product.image_scenes}
            >
              <WishlistButton
                className={styles.wishlist_btn}
                sortKey={product.sort_key}
                productKey={product.key}
                LANG={LANG}
              />
              <img
                data-loading
                className={styles.product_image}
                alt={product.name}
                src={fillOssImage(product.image)}
              />
              {product.image_scenes ? (
                <img
                  data-loading
                  className={styles.scenes_image}
                  alt={product.name}
                  src={fillOssImage(product.image_scenes)}
                />
              ) : null}
              {/* 限时折扣标签 + 倒计时：命中自动规则折扣时展示（永不过期则仅标签、无倒计时） */}
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
              {/* 产品评分 */}
              {product.reviews_score ? (
                <ReviewRate
                  LANG={LANG}
                  reviewsNum={product.reviews_num}
                  reviewScore={product.reviews_score}
                />
              ) : null}
              {/* 产品名称 */}
              <h3 className={styles.product_name}>{product.name}</h3>
              {/* 产品价格：pricing 未就绪显示骨架；就绪后无 product_price 显示缺货；否则原价 */}
              {!pricingReady ? (
                <div className={styles.product_price_container}>
                  <Skeleton variant="rect" width={80} height={16} />
                </div>
              ) : !areaInfo?.product_price ? (
                <div className={styles.product_stock_container}>
                  {LANG["store.index.no_stock"]}
                </div>
              ) : autoDiscount && savedAmount > 0 ? (
                <>
                  <div className={styles.product_price_container}>
                    <div>{`${areaInfo.currency_symbol}${formatCurrency(
                      discountedPrice,
                      areaInfo.currency_unit
                    )}`}</div>
                    <div>{`${areaInfo.currency_symbol}${formatCurrency(
                      areaInfo.product_price,
                      areaInfo.currency_unit
                    )}`}</div>
                  </div>
                </>
              ) : (
                <div className={styles.product_price_container}>
                  <div>{`${areaInfo.currency_symbol}${formatCurrency(
                    areaInfo.product_price,
                    areaInfo.currency_unit
                  )}`}</div>
                </div>
              )}
            </div>
          </Link>
        );
      })}
    </section>
  );
}

export default function ProductList() {
  const { LANG, goodsSortList, locale } = React.useContext(IndexContent);
  const { area, areaReady } = useArea();

  // 全部 (sortKey, productKey) 集合（一次批量取价的输入）。
  const allKeys = React.useMemo(() => {
    const keys = [];
    goodsSortList.forEach((sort) => {
      (sort.goodList || []).forEach((p) => {
        if (p.sort_key && p.key) {
          keys.push({ sortKey: p.sort_key, productKey: p.key });
        }
      });
    });
    return keys;
  }, [goodsSortList]);

  // pricingMap: { "{sortKey}:{productKey}": ProductsPricingItem } —— null 表示未就绪。
  const [pricingMap, setPricingMap] = React.useState(null);
  // discountMap：按 product_key 索引的自动规则折扣（限时促销），未就绪为 {}。
  const [discountMap, setDiscountMap] = React.useState({});

  // 一次批量取「价格 + 折扣」聚合：同一份 list 里既建 pricingMap（按 sortKey:productKey）
  // 又建 discountMap（按 product_key），取代原先价、折扣两条并行请求 + 客户端手动对齐。
  React.useEffect(() => {
    if (!areaReady) return;
    let cancelled = false;
    const effectiveArea = area || "us";
    getProductsOffer({
      area: effectiveArea,
      locale,
      keys: allKeys
    }).then((data) => {
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

  return (
    <div className={styles.container}>
      {goodsSortList.map((item, index) => {
        return (
          <div className={styles.sort_container} key={index} id={item.key}>
            <div className={styles.sort_header}>
              <h2>{item.name}</h2>
            </div>
            <ProductItem
              key={index}
              goodList={item.goodList}
              LANG={LANG}
              pricingMap={pricingMap}
              pricingReady={pricingReady}
              discountMap={discountMap}
            />
          </div>
        );
      })}
    </div>
  );
}
