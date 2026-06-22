"use client";
import React from "react";
import styles from "./index.module.scss";
import ProductContext from "../../../ProductContext";
import WishlistButton from "@/components/WishlistButton";

export default function GoodMainText() {
  const { productInfo, sortKey, productKey, LANG } =
    React.useContext(ProductContext);
  return (
    <div className={styles.container}>
      <div className={styles.title_row}>
        <h1>{productInfo.name}</h1>
        <WishlistButton
          className={styles.wishlist_btn}
          sortKey={sortKey}
          productKey={productKey}
          LANG={LANG}
          size={40}
        />
      </div>
      {/* 配置的亮点 */}
      {Array.isArray(productInfo.sellingList) &&
      productInfo.sellingList.length > 0 ? (
        <ul className={styles.product_advantage}>
          {productInfo.sellingList.map((item, index) => {
            return (
              <li
                key={index}
                dangerouslySetInnerHTML={{
                  __html: item.light,
                }}
              ></li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
