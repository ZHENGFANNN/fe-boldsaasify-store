/** @format */

"use client";

// 收藏页主体（客户端）：
//   - 从 useWishlist store 取收藏键（游客本地 / 登录后端，store 内已处理合并）。
//   - 用服务端下发的 catalog（{ "sortKey:productKey": product }）映射出可展示商品；
//     收藏里有但目录里查不到的（下架等）静默跳过。
//   - 价格沿用 getProductsOffer 客户端批量取（价格+折扣聚合接口，仅用价；与首页/分类页同源、同缓存）。
//   - 卡片右上角复用 WishlistButton（此处即「取消收藏」入口，移除后即时从列表消失）。

import React from "react";
import Link from "next/link";

import { formatCurrency, fillOssImage } from "@/utils";
import useArea from "@/hooks/useArea";
import useWishlist from "@/hooks/useWishlist";
import Skeleton from "@/components/Skeleton";
import WishlistButton from "@/components/WishlistButton";
import getProductsOffer from "@/service/product/get-offer";

import styles from "./index.module.scss";

// 从批量取价结果挑出当前商品的 areaInfo：取首个有 areaInfo 的 combo。
function pickAreaInfo(pricingItem) {
  if (!pricingItem) return null;
  const combos = Array.isArray(pricingItem.combos) ? pricingItem.combos : [];
  for (const c of combos) {
    if (c?.areaInfo) return c.areaInfo;
  }
  return null;
}

const SHOP_HREF = "/product/rings";

export default function WishlistClient({ LANG, locale, catalog }) {
  const t = (key, fallback) => LANG?.[key] ?? fallback;

  const ready = useWishlist((s) => s.ready);
  const items = useWishlist((s) => s.items);
  const init = useWishlist((s) => s.init);

  const { area, areaReady } = useArea();
  const [pricingMap, setPricingMap] = React.useState(null);
  const pricingReady = pricingMap !== null;

  React.useEffect(() => {
    init();
  }, [init]);

  // 收藏键 → 目录商品（过滤掉目录里查不到的）。
  const products = React.useMemo(() => {
    return items
      .map((it) => catalog?.[`${it.sortKey}:${it.productKey}`])
      .filter(Boolean);
  }, [items, catalog]);

  const allKeys = React.useMemo(
    () =>
      products
        .filter((p) => p.sort_key && p.key)
        .map((p) => ({ sortKey: p.sort_key, productKey: p.key })),
    [products]
  );

  React.useEffect(() => {
    if (!areaReady) return;
    if (allKeys.length === 0) {
      setPricingMap({});
      return;
    }
    let cancelled = false;
    // 复用价格+折扣聚合接口，心愿单目前仅展示价格：只建 pricingMap（折扣字段忽略）。
    getProductsOffer({
      area: area || "us",
      locale,
      keys: allKeys
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

  return (
    <main className={styles.page} data-role="wishlist">
      <nav className={styles.breadcrumb} aria-label="breadcrumb">
        <Link href="/">{t("common.nav.home", "Home")}</Link>
        <span className={styles.sep}>/</span>
        <span className={styles.current}>
          {t("store.wishlist.title", "My Wishlist")}
        </span>
      </nav>

      <header className={styles.header}>
        <h1 className={styles.title}>
          {t("store.wishlist.title", "My Wishlist")}
        </h1>
        {ready && products.length > 0 ? (
          <p className={styles.subtitle}>
            {t(
              "store.wishlist.subtitle",
              "The pieces you've saved. Take your time — they'll be here when you're ready."
            )}
          </p>
        ) : null}
      </header>

      {/* store 未就绪：占位骨架（避免首屏闪「空清单」） */}
      {!ready ? (
        <section className={styles.grid} aria-hidden="true">
          {Array.from({ length: 4 }).map((_, i) => (
            <div className={styles.card} key={i}>
              <Skeleton variant="rect" width="100%" height={0} />
            </div>
          ))}
        </section>
      ) : products.length === 0 ? (
        // 空态：引导去商品页
        <section className={styles.empty}>
          <div className={styles.empty_icon} aria-hidden="true">
            ♡
          </div>
          <h2 className={styles.empty_title}>
            {t("store.wishlist.empty_title", "Your wishlist is empty")}
          </h2>
          <p className={styles.empty_desc}>
            {t(
              "store.wishlist.empty_desc",
              "Tap the heart on any piece to save it here and find it easily later."
            )}
          </p>
          <Link className={styles.empty_cta} href={SHOP_HREF}>
            {t("store.wishlist.empty_cta", "Browse our collection")}
          </Link>
        </section>
      ) : (
        <section className={styles.grid}>
          {products.map((product) => {
            const areaInfo = pricingReady
              ? pickAreaInfo(
                  pricingMap?.[`${product.sort_key}:${product.key}`]
                )
              : null;
            return (
              <Link
                key={`${product.sort_key}:${product.key}`}
                scroll={true}
                href={`/product/${product.sort_key}/${product.key}`}
                className={styles.card}
              >
                <div className={styles.image_container}>
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
                </div>
                <div className={styles.content}>
                  <h3 className={styles.product_name}>{product.name}</h3>
                  {!pricingReady ? (
                    <div className={styles.price}>
                      <Skeleton variant="rect" width={80} height={16} />
                    </div>
                  ) : !areaInfo?.product_price ? (
                    <div className={styles.stock}>
                      {t("store.index.no_stock", "Out of stock")}
                    </div>
                  ) : (
                    <div className={styles.price}>
                      {`${areaInfo.currency_symbol}${formatCurrency(
                        areaInfo.product_price,
                        areaInfo.currency_unit
                      )}`}
                    </div>
                  )}
                </div>
              </Link>
            );
          })}
        </section>
      )}
    </main>
  );
}
