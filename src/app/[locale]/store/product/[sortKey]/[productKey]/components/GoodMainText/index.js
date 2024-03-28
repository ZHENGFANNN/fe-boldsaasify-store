"use client";
import React from "react";
import styles from "./index.module.scss";
import ProductContext from "../../ProductContext";

export default function GoodMainText() {
  const { productInfo } = React.useContext(ProductContext);
  return (
    <dvi className={styles.container}>
      <h1>{productInfo.name}</h1>
      {/* 配置的亮点 */}
      {productInfo.sellingList.length > 0 ? (
        <ul className={styles.product_advantage}>
          {productInfo.sellingList.map((item, index) => {
            if (index > 3) {
              return null;
            } else {
              return (
                <li key={index}>
                  <span className={styles.product_advantage_symbol}>✅</span>
                  {item.light}
                </li>
              );
            }
          })}
        </ul>
      ) : null}
    </dvi>
  );
}
