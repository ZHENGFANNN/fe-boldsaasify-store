"use client";
import React from "react";
import ProductContext from "../../ProductContext";

import styles from "./index.module.scss";
export default function GoodNumber() {
  const { LANG, productNum, setProductNum } = React.useContext(ProductContext);

  return (
    <div className={styles.product_num}>
      <h3>{LANG["store.product.amount"]}</h3>
      <div className={styles.product_num_operation}>
        <div
          className={styles.product_num_symbol}
          onClick={() => {
            if (productNum < 2) {
              return;
            }
            setProductNum(productNum - 1);
          }}
        >
          -
        </div>
        <input
          className={styles.product_num_text}
          value={productNum}
          type="number"
          onChange={(e) => {
            const number = Number(e.target.value);
            if (number > 9998) setProductNum(9999);
            else if (number < 2) setProductNum(1);
            else setProductNum(number);
          }}
        />
        <div
          className={styles.product_num_symbol}
          onClick={() => {
            if (productNum > 99998) {
              return;
            }
            setProductNum(productNum + 1);
          }}
        >
          +
        </div>
      </div>
    </div>
  );
}
