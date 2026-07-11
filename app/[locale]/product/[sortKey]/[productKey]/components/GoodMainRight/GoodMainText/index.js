"use client";
import React from "react";
import styles from "./index.module.scss";
import ProductContext from "../../../ProductContext";

export default function GoodMainText() {
  const { productInfo } = React.useContext(ProductContext);
  return (
    <div className={styles.container}>
      <h1>{productInfo.name}</h1>
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
