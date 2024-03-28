"use client";
import React from "react";
import ProductContext from "../../ProductContext";

import styles from "./index.module.scss";
export default function GoodAccessoriesList() {
  const {
    LANG,
    productInfo: { associationsList },
  } = React.useContext(ProductContext);
  if (associationsList.length < 1) return null;
  return (
    <section className={`${styles.accessories}`} id="product_specs">
      <div className={styles.accessories_container}>
        <h2>{LANG["store.product.specifiche"]}</h2>
        <div className={styles.accessories_item}>
          <ul>
            {associationsList
              .slice(0, Math.ceil(associationsList.length / 2))
              .map((item, index) => {
                return (
                  <li key={index}>
                    <h4>{item.key}</h4>
                    <p>{item.value}</p>
                  </li>
                );
              })}
          </ul>
          <ul>
            {associationsList
              .slice(
                Math.ceil(associationsList.length / 2),
                associationsList.length
              )
              .map((item, index) => {
                return (
                  <li key={index}>
                    <h4>{item.key}</h4>
                    <p>{item.value}</p>
                  </li>
                );
              })}
          </ul>
        </div>
      </div>
    </section>
  );
}
