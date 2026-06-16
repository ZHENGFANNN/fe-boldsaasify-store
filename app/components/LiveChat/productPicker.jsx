"use client";

import React from "react";
import styles from "./index.module.scss";
import { getRecentlyViewed } from "./recentlyViewed";

// 商城商品 -> 统一展示/快照结构。价格取首个套餐的常规售价(product_price)，与购物车默认展示口径一致。
function fromCatalog(product, locale) {
  const area = product?.comboList?.[0]?.areaInfo || null;
  return {
    productKey: product?.key || "",
    sortKey: product?.sort_key || "",
    title: product?.name || "",
    image: product?.image || "",
    symbol: area?.currency_symbol || "",
    price: area?.product_price ?? "",
    href: `/${locale}/product/${product?.sort_key}/${product?.key}`,
  };
}

// 购物车来源：读 store_shopping 行 -> 按 productKey+sortKey 关联全量商品 -> 按商品去重
function readCartProducts(products, locale) {
  if (typeof window === "undefined") return [];
  let lines = [];
  try {
    lines = JSON.parse(localStorage.getItem("store_shopping") || "[]") || [];
  } catch (err) {
    lines = [];
  }
  const seen = new Set();
  const list = [];
  lines.forEach((line) => {
    const product = products.find(
      (p) => p.key === line.productKey && p.sort_key === line.sortKey
    );
    if (!product || seen.has(product.key)) return;
    seen.add(product.key);
    list.push(fromCatalog(product, locale));
  });
  return list;
}

const SEARCH_LIMIT = 30;

export default function ProductPicker({ copy, locale, products, onPick, onClose }) {
  const catalog = Array.isArray(products) ? products : [];
  const cartItems = React.useMemo(
    () => readCartProducts(catalog, locale),
    [catalog, locale]
  );
  const recentItems = React.useMemo(() => getRecentlyViewed(), []);

  // 默认 Tab：优先有内容的来源（购物车 > 最近浏览 > 搜索）
  const initialTab = cartItems.length
    ? "cart"
    : recentItems.length
      ? "recent"
      : "search";
  const [tab, setTab] = React.useState(initialTab);
  const [query, setQuery] = React.useState("");

  const searchItems = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return catalog
      .filter((p) => String(p.name || "").toLowerCase().includes(q))
      .slice(0, SEARCH_LIMIT)
      .map((p) => fromCatalog(p, locale));
  }, [query, catalog, locale]);

  const tabs = [
    { key: "cart", label: copy?.productTabCart || "Cart" },
    { key: "recent", label: copy?.productTabRecent || "Recently viewed" },
    { key: "search", label: copy?.productTabSearch || "Search" },
  ];

  const renderList = (items, emptyText) => {
    if (!items.length) {
      return <div className={styles.productPickerEmpty}>{emptyText}</div>;
    }
    return (
      <ul className={styles.productPickerList}>
        {items.map((item) => (
          <li className={styles.productPickerItem} key={`${item.sortKey}/${item.productKey}`}>
            <button
              type="button"
              className={styles.productPickerItemBtn}
              onClick={() => onPick?.(item)}
            >
              {item.image ? (
                <img
                  className={styles.productPickerThumb}
                  src={item.image}
                  alt={item.title}
                />
              ) : (
                <span className={styles.productPickerThumb} />
              )}
              <span className={styles.productPickerInfo}>
                <span className={styles.productPickerName}>{item.title}</span>
                {item.price !== "" && item.price !== undefined ? (
                  <span className={styles.productPickerPrice}>
                    {item.symbol}
                    {item.price}
                  </span>
                ) : null}
              </span>
            </button>
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div className={styles.orderPickerOverlay} role="dialog" aria-modal="true">
      <div className={styles.orderPickerSheet}>
        <div className={styles.orderPickerHead}>
          <span className={styles.orderPickerTitle}>
            {copy?.productPickerTitle || "Share a product"}
          </span>
          <button
            type="button"
            className={styles.orderPickerClose}
            aria-label="Close"
            onClick={onClose}
          >
            ×
          </button>
        </div>
        <div className={styles.productPickerTabs}>
          {tabs.map((t) => (
            <button
              type="button"
              key={t.key}
              className={`${styles.productPickerTab} ${
                tab === t.key ? styles.productPickerTabActive : ""
              }`}
              onClick={() => setTab(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>
        {tab === "search" ? (
          <div className={styles.productPickerSearch}>
            <input
              className={styles.productPickerSearchInput}
              value={query}
              placeholder={copy?.productSearchPlaceholder || "Search products..."}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
            />
          </div>
        ) : null}
        <div className={styles.orderPickerBody}>
          {tab === "cart"
            ? renderList(cartItems, copy?.productCartEmpty || "Your cart is empty.")
            : null}
          {tab === "recent"
            ? renderList(
                recentItems,
                copy?.productRecentEmpty || "No recently viewed products yet."
              )
            : null}
          {tab === "search"
            ? renderList(
                searchItems,
                query.trim()
                  ? copy?.productSearchEmpty || "No products found."
                  : copy?.productSearchHint || "Type to search products."
              )
            : null}
        </div>
      </div>
    </div>
  );
}
