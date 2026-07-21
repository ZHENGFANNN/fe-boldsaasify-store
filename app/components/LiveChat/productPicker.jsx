"use client";

import React from "react";
import styles from "./index.module.scss";
import { getRecentlyViewed } from "./recentlyViewed";
import resolveCartFromApi from "@/components/Layout/cartClient";

// 购物车行 -> 统一展示/快照结构（与 CartModal 同源 /api/cart）
function fromCartRow(row, locale) {
  return {
    productKey: row?.productKey || "",
    sortKey: row?.sortKey || "",
    title: row?.name || "",
    image: row?.image || "",
    symbol: row?.areaInfo?.currency_symbol || "",
    price: row?.areaInfo?.product_price ?? "",
    href: `/${locale}/product/${row?.sortKey}/${row?.productKey}`,
  };
}

// 目录搜索结果 -> 统一展示结构（价格可选，搜索目录不含价）
function fromCatalogHit(item, locale) {
  return {
    productKey: item?.key || "",
    sortKey: item?.sort_key || "",
    title: item?.name || "",
    image: item?.image || "",
    symbol: "",
    price: "",
    href: `/${locale}/product/${item?.sort_key}/${item?.key}`,
  };
}

const SEARCH_DEBOUNCE_MS = 250;

// 记住用户上次选中的分享 Tab（纯客户端）
const TAB_KEY = "boldradiant_livechat_product_tab";
const VALID_TABS = ["cart", "recent", "search"];

function getSavedTab() {
  if (typeof window === "undefined") return "";
  try {
    const saved = localStorage.getItem(TAB_KEY);
    return VALID_TABS.includes(saved) ? saved : "";
  } catch (err) {
    return "";
  }
}

export default function ProductPicker({ copy, locale, area, onPick, onClose }) {
  const recentItems = React.useMemo(() => getRecentlyViewed(), []);
  const [cartItems, setCartItems] = React.useState([]);
  const [cartLoading, setCartLoading] = React.useState(false);
  const [cartReady, setCartReady] = React.useState(false);

  // 默认 Tab：优先复用用户上次选中的 Tab；无记录时默认「最近浏览」
  // （最近浏览为空才回退到 search，避免开局空面板）。
  const initialTab =
    getSavedTab() || (recentItems.length ? "recent" : "search");
  const [tab, setTab] = React.useState(initialTab);
  const [query, setQuery] = React.useState("");
  const [searchItems, setSearchItems] = React.useState([]);
  const [searchLoading, setSearchLoading] = React.useState(false);

  // 每次切 Tab 都持久化，下次打开记住选择
  React.useEffect(() => {
    try {
      localStorage.setItem(TAB_KEY, tab);
    } catch (err) {
      // ignore quota / serialize errors
    }
  }, [tab]);

  // Cart Tab：与站内购物车同源，读 store_shopping → /api/cart
  React.useEffect(() => {
    if (tab !== "cart") return undefined;
    let cancelled = false;
    setCartLoading(true);
    resolveCartFromApi({ area: area || "us", language: locale || "en" })
      .then((rows) => {
        if (cancelled) return;
        const seen = new Set();
        const list = [];
        (rows || []).forEach((row) => {
          if (!row?.productKey || seen.has(row.productKey)) return;
          seen.add(row.productKey);
          list.push(fromCartRow(row, locale));
        });
        setCartItems(list);
        setCartReady(true);
      })
      .catch(() => {
        if (cancelled) return;
        setCartItems([]);
        setCartReady(true);
      })
      .finally(() => {
        if (!cancelled) setCartLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [tab, area, locale]);

  // Search Tab：debounce 后打 /api/products-catalog
  React.useEffect(() => {
    if (tab !== "search") return undefined;
    const q = query.trim();
    if (!q) {
      setSearchItems([]);
      setSearchLoading(false);
      return undefined;
    }

    let cancelled = false;
    setSearchLoading(true);
    const timer = setTimeout(() => {
      fetch(
        `/api/products-catalog?locale=${encodeURIComponent(locale || "en")}&q=${encodeURIComponent(q)}`
      )
        .then((res) => (res.ok ? res.json() : null))
        .then((json) => {
          if (cancelled) return;
          const list = Array.isArray(json?.data?.list) ? json.data.list : [];
          setSearchItems(list.map((item) => fromCatalogHit(item, locale)));
        })
        .catch(() => {
          if (!cancelled) setSearchItems([]);
        })
        .finally(() => {
          if (!cancelled) setSearchLoading(false);
        });
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [tab, query, locale]);

  const tabs = [
    { key: "cart", label: copy?.productTabCart || "Cart" },
    { key: "recent", label: copy?.productTabRecent || "Recently viewed" },
    { key: "search", label: copy?.productTabSearch || "Search" },
  ];

  const renderList = (items, emptyText, loading) => {
    if (loading) {
      return (
        <div className={styles.productPickerEmpty}>
          {copy?.productLoading || "Loading..."}
        </div>
      );
    }
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
          {/* key={tab} 让切换时重挂载，触发淡入动画，避免"先关再开"的割裂感 */}
          <div className={styles.productPickerPane} key={tab}>
            {tab === "cart"
              ? renderList(
                  cartItems,
                  copy?.productCartEmpty || "Your cart is empty.",
                  cartLoading && !cartReady
                )
              : null}
            {tab === "recent"
              ? renderList(
                  recentItems,
                  copy?.productRecentEmpty || "No recently viewed products yet.",
                  false
                )
              : null}
            {tab === "search"
              ? renderList(
                  searchItems,
                  query.trim()
                    ? copy?.productSearchEmpty || "No products found."
                    : copy?.productSearchHint || "Type to search products.",
                  searchLoading
                )
              : null}
          </div>
        </div>
      </div>
    </div>
  );
}
