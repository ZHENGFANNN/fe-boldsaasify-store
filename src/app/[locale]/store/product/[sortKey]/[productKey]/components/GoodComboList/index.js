"use client";

import React from "react";
import styles from "./index.module.scss";
import useProductStore from "../../productStore";

export default function GoodComboList({
  title = "",
  options = [],
  defaultActive,
  LANG,
  goodDiscountFestival,
}) {
  const setProductCurCombo = useProductStore(
    (state) => state.setProductCurCombo
  );
  const [active, setActive] = React.useState(() => {
    return defaultActive || options[0].id;
  });

  React.useEffect(() => {
    setProductCurCombo(options[0]);
  }, []);

  return (
    <div className={styles.container}>
      <h2>{title}</h2>
      {options.map((item) => {
        return (
          <div
            className={`${styles.list} ${
              active === item.id ? styles.active : ""
            }`}
            key={item.id}
            onClick={() => {
              setActive(item.id);
              setProductCurCombo(item);
            }}
          >
            <div className={styles.list_item}>
              {!item.areaInfo?.price || !item.areaInfo?.stock ? (
                <div className={styles.stock_tip}>
                  {LANG["store.product.no_stock"]}
                </div>
              ) : null}
              {goodDiscountFestival && item.areaInfo?.price ? (
                <div className={styles.discount_tip}>
                  OFF {100 - goodDiscountFestival.discount}%
                </div>
              ) : null}
              <div className={styles.list_item_left}>{item.title}</div>
              <div className={styles.list_item_right}>
                {goodDiscountFestival && item.areaInfo?.price ? (
                  <div>{`${item.areaInfo.currency_symbol}${
                    item.areaInfo.currency
                  } ${Math.floor(
                    item.areaInfo.price * goodDiscountFestival.discount * 0.01
                  )}`}</div>
                ) : null}
                {item.areaInfo?.price ? (
                  <div>{`${item.areaInfo?.currency_symbol}${item.areaInfo?.currency} ${item.areaInfo?.price}`}</div>
                ) : null}
              </div>
            </div>
            {item.description ? (
              <>
                <div className={styles.line}></div>
                <div className={styles.description}>{item.description}</div>
              </>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
