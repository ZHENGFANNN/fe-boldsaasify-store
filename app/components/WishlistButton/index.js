/** @format */

"use client";

// 收藏（红心）按钮：挂在商品卡片 / 详情页等处。
//   - 受 useWishlist store 驱动，选中态高亮（实心红心）。
//   - 无障碍：aria-pressed 表达选中态，aria-label 走 store.wishlist 文案 + 英文兜底。
//   - 常嵌在 <Link> 商品卡片内：onClick 里 stopPropagation + preventDefault，
//     避免点红心同时触发卡片跳转。
//   - 首屏 store 未 ready 前按钮可见但不显示选中态（避免 hydration 抖动）。

import React from "react";

import useWishlist from "@/hooks/useWishlist";
import styles from "./index.module.scss";

export default function WishlistButton({
  sortKey,
  productKey,
  LANG,
  className = "",
  size, // 可选：覆盖图标尺寸（px）
}) {
  const ready = useWishlist((s) => s.ready);
  const items = useWishlist((s) => s.items);
  const init = useWishlist((s) => s.init);
  const toggle = useWishlist((s) => s.toggle);

  React.useEffect(() => {
    init();
  }, [init]);

  const active =
    ready &&
    items.some((it) => it.sortKey === sortKey && it.productKey === productKey);

  const addLabel = LANG?.["store.wishlist.add"] ?? "Add to wishlist";
  const removeLabel = LANG?.["store.wishlist.remove"] ?? "Remove from wishlist";
  const label = active ? removeLabel : addLabel;

  const onClick = (e) => {
    // 嵌在卡片链接里时阻止冒泡跳转。
    e.preventDefault();
    e.stopPropagation();
    toggle({ sortKey, productKey });
  };

  if (!sortKey || !productKey) return null;

  return (
    <button
      type="button"
      className={`${styles.btn} ${className}`}
      data-active={active}
      aria-pressed={active}
      aria-label={label}
      title={label}
      onClick={onClick}
      style={size ? { "--wl-size": `${size}px` } : undefined}
    >
      <svg
        className={styles.heart}
        viewBox="0 0 24 24"
        width="100%"
        height="100%"
        aria-hidden="true"
        focusable="false"
      >
        <path d="M12 21s-7.534-4.747-10.07-9.243C.36 8.99 1.07 5.7 3.83 4.36c2.1-1.02 4.27-.35 5.62 1.13L12 8.06l2.55-2.57c1.35-1.48 3.52-2.15 5.62-1.13 2.76 1.34 3.47 4.63 1.9 7.4C19.53 16.25 12 21 12 21z" />
      </svg>
    </button>
  );
}
