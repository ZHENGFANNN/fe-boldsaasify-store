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
    return defaultActive || options[0]?.id;
  });

  React.useEffect(() => {
    setProductCurCombo(
      options[0] || {
        areaInfo: {},
      }
    );
  }, []);

  if (options.length < 1) return null;
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
              {/* 提示 */}
              {!item.areaInfo?.price || !item.areaInfo?.stock ? (
                <div className={styles.stock_tip}>
                  {LANG["store.product.no_stock"]}
                </div>
              ) : null}
              {goodDiscountFestival && item.areaInfo?.good_discount ? (
                <div className={styles.discount_tip}>
                  {LANG["store.product.off"]}{" "}
                  {100 - item.areaInfo?.good_discount}%
                </div>
              ) : null}
              {/* 套餐标题 */}
              <div className={styles.list_item_left}>{item.title}</div>
              {/* 套餐价格 */}
              {item.areaInfo?.price ? (
                <div className={styles.list_item_right}>
                  {goodDiscountFestival && item.areaInfo?.good_discount ? (
                    <div>{`${item.areaInfo.currency_symbol}${
                      item.areaInfo.currency
                    } ${Math.floor(
                      item.areaInfo.price * item.areaInfo?.good_discount * 0.01
                    )}`}</div>
                  ) : (
                    <div>{`${item.areaInfo?.currency_symbol}${item.areaInfo?.currency} ${item.areaInfo?.price}`}</div>
                  )}
                </div>
              ) : null}
            </div>
            {/* 套餐描述 */}
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
